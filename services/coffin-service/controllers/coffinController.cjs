/**
 * Coffin Controller - Complete inventory management with cross-branch requests
 * Updated to match new database schema with VARCHAR coffin_id
 */

const { query, execute } = require('../../../shared/dbConfig');
const { validateTenantActive } = require('../../../shared/tenancy');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs/promises');
const slugify = require('slugify');

// ============================================
// CONFIGURATION
// ============================================

const EXCHANGE_RATES = { USD: 150, KES: 1 };
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// In-memory cache
const coffinCache = new Map();
const CACHE_TTL = 300000; // 5 minutes

// ============================================
// UTILITY FUNCTIONS
// ============================================

const getCached = (key) => {
    const cached = coffinCache.get(key);
    if (cached && cached.expiry > Date.now()) return cached.data;
    coffinCache.delete(key);
    return null;
};

const setCached = (key, data) => {
    coffinCache.set(key, { data, expiry: Date.now() + CACHE_TTL });
};

const clearCache = (pattern) => {
    if (pattern) {
        for (const key of coffinCache.keys()) {
            if (key.includes(pattern)) coffinCache.delete(key);
        }
    } else {
        coffinCache.clear();
    }
};

const generateCoffinId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `COF-${timestamp}-${random}`;
};

const sharp = require('sharp');

// ─── Upload path fallbacks ───
const getUploadBaseDir = () => {
    const paths = [
        path.join(__dirname, '../../uploads/coffins'),
        path.join(__dirname, '../../../uploads/coffins'),
        path.join(process.cwd(), 'uploads/coffins'),
        '/app/uploads/coffins',
    ];
    return paths;
};

const ensureUploadDir = async (tenantSlug) => {
    const possiblePaths = getUploadBaseDir();
    let dir = null;

    for (const basePath of possiblePaths) {
        const candidate = path.join(basePath, tenantSlug);
        try {
            await fs.mkdir(candidate, { recursive: true });
            const testFile = path.join(candidate, '.write-test');
            await fs.writeFile(testFile, 'test');
            await fs.unlink(testFile);
            dir = candidate;
            console.log(`[COFFIN] Upload dir set: ${dir}`);
            break;
        } catch (e) {
            console.warn(`[COFFIN] Cannot use upload path: ${candidate} - ${e.message}`);
        }
    }

    if (!dir) {
        dir = path.join(require('os').tmpdir(), 'coffin-uploads', tenantSlug);
        await fs.mkdir(dir, { recursive: true });
        console.log(`[COFFIN] Using temp upload dir: ${dir}`);
    }

    return dir;
};

// ─── Image compression ───
const compressAndSaveImage = async (buffer, filename, tenantSlug) => {
    const dir = await ensureUploadDir(tenantSlug);

    const safeName = filename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/\.[^.]+$/, '')
        .slice(0, 50);

    const webpName = `${safeName}-${Date.now()}.webp`;
    const outputPath = path.join(dir, webpName);

    try {
        const metadata = await sharp(buffer).metadata();
        console.log(`[COFFIN] Image metadata: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

        await sharp(buffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(outputPath);

        const stats = await fs.stat(outputPath);
        console.log(`[COFFIN] Image saved: ${webpName} (${(stats.size / 1024).toFixed(1)}KB)`);

        return `/uploads/coffins/${tenantSlug}/${webpName}`;
    } catch (err) {
        console.error(`[COFFIN] Image processing error:`, err);
        throw err;
    }
};

// ─── Stock status helper ───
const getStockStatus = (stock) => {
    if (stock <= 0) return 'Out of Stock';
    if (stock <= 2) return 'Low Stock';
    return 'Available';
};

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

const createCoffin = async (req, res) => {
    const tenantSlug = req.tenantSlug;

    if (!tenantSlug) {
        return res.status(403).json({ success: false, message: 'Valid tenant required' });
    }

    try {
        const { name, type, material, price, stock, notes, branch_id } = req.body;

        if (!name || !type || !material || !price) {
            return res.status(400).json({ success: false, message: 'Missing required fields: name, type, material, price' });
        }

        const branchId = branch_id || req.headers['x-branch-id'] || req.tenant?.branch_id;
        if (!branchId) {
            return res.status(400).json({ success: false, message: 'Branch ID is required' });
        }

        const coffinId = generateCoffinId();
        const sku = `${type.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;

        const sql = `
            INSERT INTO coffins (coffin_id, tenant_slug, branch_id, name, sku, type, material, price, stock, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await execute(req, sql, [coffinId, tenantSlug, branchId, name, sku, type, material, price, stock || 0, notes || null]);

        // Handle image upload if present
        let imageUrls = [];
        if (req.file) {
            const imageUrl = await compressAndSaveImage(req.file.buffer, req.file.originalname, tenantSlug);
            await execute(req,
                'INSERT INTO coffin_images (coffin_id, tenant_slug, image_url) VALUES (?, ?, ?)',
                [coffinId, tenantSlug, imageUrl]
            );
            imageUrls = [imageUrl];
        }

        clearCache(tenantSlug);

        return res.status(201).json({
            success: true,
            message: 'Coffin created successfully',
            data: {
                coffin_id: coffinId,
                sku,
                name,
                type,
                material,
                price,
                stock: stock || 0,
                images: imageUrls
            }
        });

    } catch (error) {
        console.error('Create coffin error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


const getAllCoffins = async (req, res) => {
    const tenantSlug = req.tenantSlug;
    const branchId = req.headers['x-branch-id'] || req.tenant?.branch_id;

    if (!tenantSlug) {
        return res.status(403).json({ success: false, message: 'Valid tenant required' });
    }

    try {
        const cacheKey = `allCoffins_${tenantSlug}_${branchId || 'all'}`;
        let coffins = getCached(cacheKey);

        if (!coffins) {
            let sql = `
                SELECT 
                    c.*,
                    COALESCE(b.branch_name, 'Main Branch') as branch_name,
                    COALESCE(b.color, '#0d9488') as branch_color,
                    GROUP_CONCAT(DISTINCT ci.image_url ORDER BY ci.display_order) as image_urls
                FROM coffins c
                LEFT JOIN branches b ON c.branch_id = b.id AND c.tenant_slug = b.tenant_slug
                LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id AND c.tenant_slug = ci.tenant_slug
                WHERE c.tenant_slug = ? AND c.is_deleted = FALSE
            `;

            const params = [tenantSlug];

            if (branchId) {
                sql += ' AND c.branch_id = ?';
                params.push(branchId);
            }

            sql += ' GROUP BY c.coffin_id ORDER BY c.created_at DESC';

            coffins = await query(req, sql, params);

            coffins = coffins.map(coffin => ({
                ...coffin,
                price: parseFloat(coffin.price),
                exact_price: parseFloat(coffin.exact_price),
                stock: parseInt(coffin.stock) || 0,
                images: coffin.image_urls ? coffin.image_urls.split(',').slice(0, 10) : [],
                primary_image: coffin.image_urls ? coffin.image_urls.split(',')[0] : null,
                stock_status: getStockStatus(coffin.stock)
            }));

            setCached(cacheKey, coffins);
        }

        return res.status(200).json({
            success: true,
            data: coffins,
            count: coffins.length,
            tenant: tenantSlug,
            branch: branchId
        });

    } catch (error) {
        console.error('Get all coffins error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getCoffinById = async (req, res) => {
    const tenantSlug = req.tenantSlug;
    const { id } = req.params;

    if (!tenantSlug) {
        return res.status(403).json({ success: false, message: 'Valid tenant required' });
    }

    try {
        const cacheKey = `coffin_${tenantSlug}_${id}`;
        let coffin = getCached(cacheKey);

        if (!coffin) {
            const sql = `
                SELECT 
                    c.*,
                    COALESCE(b.branch_name, 'Main Branch') as branch_name,
                    COALESCE(b.color, '#0d9488') as branch_color,
                    GROUP_CONCAT(DISTINCT ci.image_url ORDER BY ci.display_order) as image_urls
                FROM coffins c
                LEFT JOIN branches b ON c.branch_id = b.id AND c.tenant_slug = b.tenant_slug
                LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id AND c.tenant_slug = ci.tenant_slug
                WHERE (c.coffin_id = ? OR c.sku = ? OR c.custom_id = ?) AND c.tenant_slug = ? AND c.is_deleted = FALSE
                GROUP BY c.coffin_id
            `;

            const coffins = await query(req, sql, [id, id, id, tenantSlug]);

            if (coffins.length === 0) {
                return res.status(404).json({ success: false, message: 'Coffin not found' });
            }

            coffin = coffins[0];
            coffin.images = coffin.image_urls ? coffin.image_urls.split(',').slice(0, 10) : [];
            coffin.price = parseFloat(coffin.price);
            coffin.exact_price = parseFloat(coffin.exact_price);
            coffin.stock = parseInt(coffin.stock) || 0;
            coffin.stock_status = getStockStatus(coffin.stock);

            setCached(cacheKey, coffin);
        }

        return res.status(200).json({ success: true, data: coffin });

    } catch (error) {
        console.error('Get coffin by ID error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateCoffin = async (req, res) => {
    const tenantSlug = req.tenantSlug;
    const { id } = req.params;

    if (!tenantSlug) {
        return res.status(403).json({ success: false, message: 'Valid tenant required' });
    }

    try {
        const { name, type, material, price, stock, notes, branch_id } = req.body;

        const sql = `
            UPDATE coffins 
            SET name = ?, type = ?, material = ?, price = ?, stock = ?, notes = ?, branch_id = ?
            WHERE (coffin_id = ? OR sku = ?) AND tenant_slug = ? AND is_deleted = FALSE
        `;

        const result = await execute(req, sql, [
            name, type, material, price, stock || 0, notes || null, branch_id,
            id, id, tenantSlug
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Coffin not found' });
        }

        // Handle image upload if present
        if (req.file) {
            const imageUrl = await compressAndSaveImage(req.file.buffer, req.file.originalname, tenantSlug);
            await execute(req,
                'INSERT INTO coffin_images (coffin_id, tenant_slug, image_url) VALUES (?, ?, ?)',
                [id, tenantSlug, imageUrl]
            );
        }

        clearCache(tenantSlug);

        return res.status(200).json({ success: true, message: 'Coffin updated successfully' });

    } catch (error) {
        console.error('Update coffin error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteCoffin = async (req, res) => {
    const tenantSlug = req.tenantSlug;
    const { id } = req.params;

    if (!tenantSlug) {
        return res.status(403).json({ success: false, message: 'Valid tenant required' });
    }

    try {
        const sql = 'UPDATE coffins SET is_deleted = TRUE WHERE (coffin_id = ? OR sku = ?) AND tenant_slug = ?';
        const result = await execute(req, sql, [id, id, tenantSlug]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Coffin not found' });
        }

        clearCache(tenantSlug);

        return res.status(200).json({ success: true, message: 'Coffin deleted successfully' });

    } catch (error) {
        console.error('Delete coffin error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Booking Functions ───

const createBooking = async (req, res) => {
    const tenantSlug = req.tenantSlug;

    if (!tenantSlug) {
        return res.status(403).json({ success: false, message: 'Valid tenant required' });
    }

    try {
        const { client_name, client_phone, deceased_name, coffin_id, service_date, notes, branch_id } = req.body;

        if (!client_name || !deceased_name || !coffin_id || !service_date) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const branchId = branch_id || req.headers['x-branch-id'] || req.tenant?.branch_id;
        if (!branchId) {
            return res.status(400).json({ success: false, message: 'Branch ID is required' });
        }

        const bookingId = `BK-${Date.now().toString().slice(-8)}`;

        const sql = `
            INSERT INTO bookings (tenant_slug, branch_id, booking_id, client_name, client_phone, deceased_name, coffin_id, service_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await execute(req, sql, [tenantSlug, branchId, bookingId, client_name, client_phone, deceased_name, coffin_id, service_date, notes || null]);

        clearCache(tenantSlug);

        return res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: { booking_id: bookingId }
        });

    } catch (error) {
        console.error('Create booking error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getBookings = async (req, res) => {
    const tenantSlug = req.tenantSlug;
    const branchId = req.headers['x-branch-id'] || req.tenant?.branch_id;

    if (!tenantSlug) {
        return res.status(403).json({ success: false, message: 'Valid tenant required' });
    }

    try {
        let sql = `
            SELECT 
                b.*,
                br.branch_name,
                br.color as branch_color,
                c.name as coffin_name,
                c.sku as coffin_sku,
                c.type as coffin_type,
                c.material as coffin_material,
                c.price as coffin_price,
                GROUP_CONCAT(DISTINCT ci.image_url) as coffin_images
            FROM bookings b
            LEFT JOIN branches br ON b.branch_id = br.id AND b.tenant_slug = br.tenant_slug
            LEFT JOIN coffins c ON b.coffin_id = c.coffin_id AND b.tenant_slug = c.tenant_slug
            LEFT JOIN coffin_images ci ON b.coffin_id = ci.coffin_id AND b.tenant_slug = ci.tenant_slug
            WHERE b.tenant_slug = ?
        `;

        const params = [tenantSlug];

        if (branchId) {
            sql += ' AND b.branch_id = ?';
            params.push(branchId);
        }

        sql += ' GROUP BY b.id ORDER BY b.created_at DESC';

        const bookings = await query(req, sql, params);

        return res.status(200).json({
            success: true,
            data: bookings,
            count: bookings.length
        });

    } catch (error) {
        console.error('Get bookings error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Stock Request Functions ───

const createStockRequest = async (req, res) => {
    const tenantSlug = req.tenantSlug;

    if (!tenantSlug) {
        return res.status(403).json({ success: false, message: 'Valid tenant required' });
    }

    try {
        const { from_branch_id, to_branch_id, coffin_id, quantity, client_name, client_phone, deceased_name, service_date, notes } = req.body;

        if (!from_branch_id || !to_branch_id || !coffin_id || !deceased_name) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const requestId = `SR-${Date.now().toString().slice(-8)}`;

        const sql = `
            INSERT INTO stock_requests (tenant_slug, request_id, from_branch_id, to_branch_id, coffin_id, quantity, client_name, client_phone, deceased_name, service_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await execute(req, sql, [tenantSlug, requestId, from_branch_id, to_branch_id, coffin_id, quantity || 1, client_name, client_phone, deceased_name, service_date, notes || null]);

        clearCache(tenantSlug);

        return res.status(201).json({
            success: true,
            message: 'Stock request created successfully',
            data: { request_id: requestId }
        });

    } catch (error) {
        console.error('Create stock request error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getStockRequests = async (req, res) => {
    const tenantSlug = req.tenantSlug;
    const branchId = req.headers['x-branch-id'] || req.tenant?.branch_id;

    if (!tenantSlug) {
        return res.status(403).json({ success: false, message: 'Valid tenant required' });
    }

    try {
        let sql = `
            SELECT 
                sr.*,
                b_from.branch_name as from_branch_name,
                b_from.color as from_branch_color,
                b_to.branch_name as to_branch_name,
                b_to.color as to_branch_color,
                c.name as coffin_name,
                c.sku as coffin_sku,
                c.type as coffin_type,
                c.material as coffin_material,
                GROUP_CONCAT(DISTINCT ci.image_url) as coffin_images
            FROM stock_requests sr
            LEFT JOIN branches b_from ON sr.from_branch_id = b_from.id AND sr.tenant_slug = b_from.tenant_slug
            LEFT JOIN branches b_to ON sr.to_branch_id = b_to.id AND sr.tenant_slug = b_to.tenant_slug
            LEFT JOIN coffins c ON sr.coffin_id = c.coffin_id AND sr.tenant_slug = c.tenant_slug
            LEFT JOIN coffin_images ci ON sr.coffin_id = ci.coffin_id AND sr.tenant_slug = ci.tenant_slug
            WHERE sr.tenant_slug = ?
        `;

        const params = [tenantSlug];

        if (branchId) {
            sql += ' AND (sr.from_branch_id = ? OR sr.to_branch_id = ?)';
            params.push(branchId, branchId);
        }

        sql += ' GROUP BY sr.id ORDER BY sr.created_at DESC';

        const requests = await query(req, sql, params);

        return res.status(200).json({
            success: true,
            data: requests,
            count: requests.length
        });

    } catch (error) {
        console.error('Get stock requests error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateStockRequestStatus = async (req, res) => {
    const tenantSlug = req.tenantSlug;
    const { id } = req.params;
    const { status } = req.body;

    if (!tenantSlug) {
        return res.status(403).json({ success: false, message: 'Valid tenant required' });
    }

    try {
        const sql = 'UPDATE stock_requests SET status = ? WHERE request_id = ? AND tenant_slug = ?';
        const result = await execute(req, sql, [status, id, tenantSlug]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Stock request not found' });
        }

        // Add tracking entry
        await execute(req,
            'INSERT INTO stock_request_tracking (request_id, tenant_slug, status, notes) VALUES (?, ?, ?, ?)',
            [id, tenantSlug, status, `Status updated to ${status}`]
        );

        clearCache(tenantSlug);

        return res.status(200).json({ success: true, message: 'Stock request status updated' });

    } catch (error) {
        console.error('Update stock request error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Branch Functions ───

const getBranches = async (req, res) => {
    const tenantSlug = req.tenantSlug;

    if (!tenantSlug) {
        return res.status(403).json({ success: false, message: 'Valid tenant required' });
    }

    try {
        const sql = 'SELECT * FROM branches WHERE tenant_slug = ? AND is_active = TRUE ORDER BY branch_name';
        const branches = await query(req, sql, [tenantSlug]);

        return res.status(200).json({
            success: true,
            data: branches
        });

    } catch (error) {
        console.error('Get branches error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Export ───

module.exports = {
    createCoffin,
    getAllCoffins,
    getCoffinById,
    updateCoffin,
    deleteCoffin,
    createBooking,
    getBookings,
    createStockRequest,
    getStockRequests,
    updateStockRequestStatus,
    getBranches
};