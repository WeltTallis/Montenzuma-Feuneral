import { RowDataPacket } from 'mysql2';
import * as mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { TenantModel } from './Tenant.model';

export interface BranchData {
    branch_id: string; // UUID
    tenant_id: string; // UUID - reference to tenant
    branch_name: string;
    branch_slug: string;
    branch_code: string; // Human-readable code
    branch_db_name: string;
    parent_branch_id: string | null; // UUID
    branch_location: string | null;
    branch_phone: string | null;
    branch_email: string | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface BranchConnectionData {
    id: string; // UUID
    tenant_id: string; // UUID
    tenant_slug: string;
    branch_id: string; // UUID
    connected_branch_id: string; // UUID
    connection_type: 'referral' | 'transfer' | 'partnership' | 'parent_child';
    status: 'active' | 'inactive' | 'pending';
    notes: string | null;
    created_at: Date;
    updated_at: Date;
}

// Helper function to generate branch code
function generateBranchCode(tenantCode: string, branchName: string, length = 2): string {
    const slugifyFn = (text: string) => {
        return text.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };
    
    const t = String(tenantCode || 'tenant').replace(/^-+|-+$/g, '');
    const b = slugifyFn(branchName) || 'branch';
    const charset = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz0123456789';
    let random = '';
    for (let i = 0; i < length; i++) {
        random += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return `${t}-${b}-${random}`;
}

// Connection pool (reuse from TenantModel or create own)
let pool: mysql.Pool | null = null;

async function getPool(): Promise<mysql.Pool> {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'restpoint_user',
            password: process.env.DB_PASSWORD,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
        });
    }
    return pool;
}

export class BranchModel {
    
    /**
     * Get a connection to a specific tenant database
     */
    private static async getTenantConnection(dbName: string): Promise<mysql.Connection> {
        return await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'restpoint_user',
            password: process.env.DB_PASSWORD,
            database: dbName,
        });
    }

    /**
     * Create a new branch with UUID
     */
    static async create(
        tenantDbName: string,
        tenantId: string,
        tenantCode: string,
        data: {
            branch_name: string;
            branch_location?: string;
            branch_phone?: string;
            branch_email?: string;
            parent_branch_id?: string | null;
        }
    ): Promise<BranchData> {
        const conn = await this.getTenantConnection(tenantDbName);
        try {
            const branchId = uuidv4();
            const branchSlug = `${tenantDbName}-${data.branch_name.toLowerCase().replace(/\s+/g, '-')}`;
            const branchDbName = branchSlug;
            const branchCode = generateBranchCode(tenantCode, data.branch_name);

            // Check if branch already exists
            const [existing] = await conn.query<RowDataPacket[]>(
                'SELECT branch_id FROM branches WHERE branch_slug = ?',
                [branchSlug]
            );
            if (existing.length > 0) {
                throw new Error(`Branch with slug "${branchSlug}" already exists`);
            }

            // Get parent branch ID if not provided
            let parentId = data.parent_branch_id || null;
            if (!parentId) {
                const [mainBranch] = await conn.query<RowDataPacket[]>(
                    'SELECT branch_id FROM branches WHERE parent_branch_id IS NULL ORDER BY created_at ASC LIMIT 1'
                );
                if (mainBranch.length > 0) {
                    parentId = mainBranch[0].branch_id;
                }
            }

            const [result] = await conn.query<mysql.ResultSetHeader>(
                `INSERT INTO branches (
                    branch_id, 
                    branch_name, 
                    branch_slug, 
                    branch_code, 
                    branch_db_name, 
                    parent_branch_id, 
                    branch_location, 
                    branch_phone, 
                    branch_email, 
                    is_active,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
                [
                    branchId,
                    data.branch_name,
                    branchSlug,
                    branchCode,
                    branchDbName,
                    parentId,
                    data.branch_location || null,
                    data.branch_phone || null,
                    data.branch_email || null,
                ]
            );

            // Get the created branch
            const [rows] = await conn.query<RowDataPacket[]>(
                'SELECT * FROM branches WHERE branch_id = ?',
                [branchId]
            );

            return rows[0] as BranchData;
        } finally {
            await conn.end();
        }
    }

    /**
     * Find branch by ID
     */
    static async findById(tenantDbName: string, branchId: string): Promise<BranchData | null> {
        const conn = await this.getTenantConnection(tenantDbName);
        try {
            const [rows] = await conn.query<RowDataPacket[]>(
                'SELECT * FROM branches WHERE branch_id = ? AND is_active = TRUE',
                [branchId]
            );
            return rows.length > 0 ? (rows[0] as BranchData) : null;
        } finally {
            await conn.end();
        }
    }

    /**
     * Find branch by slug
     */
    static async findBySlug(tenantDbName: string, slug: string): Promise<BranchData | null> {
        const conn = await this.getTenantConnection(tenantDbName);
        try {
            const [rows] = await conn.query<RowDataPacket[]>(
                'SELECT * FROM branches WHERE branch_slug = ? AND is_active = TRUE LIMIT 1',
                [slug]
            );
            return rows.length > 0 ? (rows[0] as BranchData) : null;
        } finally {
            await conn.end();
        }
    }

    /**
     * Get all branches for a tenant
     */
    static async getAll(tenantDbName: string): Promise<BranchData[]> {
        const conn = await this.getTenantConnection(tenantDbName);
        try {
            const [rows] = await conn.query<RowDataPacket[]>(
                `SELECT * FROM branches WHERE is_active = TRUE ORDER BY 
                    CASE WHEN parent_branch_id IS NULL THEN 0 ELSE 1 END, 
                    branch_name`
            );
            return rows as BranchData[];
        } finally {
            await conn.end();
        }
    }

    /**
     * Get branch with its connections
     */
    static async getBranchWithConnections(tenantDbName: string, branchId: string): Promise<{
        branch: BranchData;
        connections: BranchConnectionData[];
    } | null> {
        const conn = await this.getTenantConnection(tenantDbName);
        try {
            // Get branch
            const [branchRows] = await conn.query<RowDataPacket[]>(
                'SELECT * FROM branches WHERE branch_id = ? AND is_active = TRUE',
                [branchId]
            );
            if (branchRows.length === 0) return null;

            // Get connections
            const [connectionRows] = await conn.query<RowDataPacket[]>(
                `SELECT * FROM branch_connections 
                WHERE branch_id = ? OR connected_branch_id = ? 
                AND status = 'active'`,
                [branchId, branchId]
            );

            return {
                branch: branchRows[0] as BranchData,
                connections: connectionRows as BranchConnectionData[]
            };
        } finally {
            await conn.end();
        }
    }

    /**
     * Update branch
     */
    static async update(
        tenantDbName: string,
        branchId: string,
        data: Partial<BranchData>
    ): Promise<boolean> {
        const conn = await this.getTenantConnection(tenantDbName);
        try {
            const fields: string[] = [];
            const values: any[] = [];

            if (data.branch_name !== undefined) {
                fields.push('branch_name = ?');
                values.push(data.branch_name);
            }
            if (data.branch_location !== undefined) {
                fields.push('branch_location = ?');
                values.push(data.branch_location);
            }
            if (data.branch_phone !== undefined) {
                fields.push('branch_phone = ?');
                values.push(data.branch_phone);
            }
            if (data.branch_email !== undefined) {
                fields.push('branch_email = ?');
                values.push(data.branch_email);
            }
            if (data.is_active !== undefined) {
                fields.push('is_active = ?');
                values.push(data.is_active);
            }
            if (data.parent_branch_id !== undefined) {
                fields.push('parent_branch_id = ?');
                values.push(data.parent_branch_id);
            }

            if (fields.length === 0) return false;

            fields.push('updated_at = NOW()');
            values.push(branchId);

            const [result] = await conn.query<mysql.ResultSetHeader>(
                `UPDATE branches SET ${fields.join(', ')} WHERE branch_id = ?`,
                values
            );
            return result.affectedRows > 0;
        } finally {
            await conn.end();
        }
    }

    /**
     * Soft delete branch
     */
    static async delete(tenantDbName: string, branchId: string): Promise<boolean> {
        const conn = await this.getTenantConnection(tenantDbName);
        try {
            // Check if branch has children
            const [children] = await conn.query<RowDataPacket[]>(
                'SELECT branch_id FROM branches WHERE parent_branch_id = ? AND is_active = TRUE',
                [branchId]
            );
            if (children.length > 0) {
                throw new Error('Cannot delete branch with active child branches');
            }

            const [result] = await conn.query<mysql.ResultSetHeader>(
                'UPDATE branches SET is_active = FALSE, updated_at = NOW() WHERE branch_id = ?',
                [branchId]
            );
            return result.affectedRows > 0;
        } finally {
            await conn.end();
        }
    }

    /**
     * Get branch hierarchy
     */
    static async getHierarchy(tenantDbName: string): Promise<any[]> {
        const conn = await this.getTenantConnection(tenantDbName);
        try {
            const [rows] = await conn.query<RowDataPacket[]>(
                `SELECT 
                    b1.branch_id,
                    b1.branch_name,
                    b1.branch_slug,
                    b1.branch_db_name,
                    b1.parent_branch_id,
                    COUNT(b2.branch_id) as child_count
                FROM branches b1
                LEFT JOIN branches b2 ON b2.parent_branch_id = b1.branch_id AND b2.is_active = TRUE
                WHERE b1.is_active = TRUE
                GROUP BY b1.branch_id
                ORDER BY 
                    CASE WHEN b1.parent_branch_id IS NULL THEN 0 ELSE 1 END,
                    b1.branch_name`
            );
            return rows;
        } finally {
            await conn.end();
        }
    }

    /**
     * Get branch statistics
     */
    static async getStats(tenantDbName: string): Promise<{
        total: number;
        active: number;
        mainBranches: number;
        subBranches: number;
    }> {
        const conn = await this.getTenantConnection(tenantDbName);
        try {
            const [rows] = await conn.query<RowDataPacket[]>(
                `SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN parent_branch_id IS NULL AND is_active = 1 THEN 1 ELSE 0 END) as main_branches,
                    SUM(CASE WHEN parent_branch_id IS NOT NULL AND is_active = 1 THEN 1 ELSE 0 END) as sub_branches
                FROM branches`
            );
            return {
                total: Number(rows[0]?.total) || 0,
                active: Number(rows[0]?.active) || 0,
                mainBranches: Number(rows[0]?.main_branches) || 0,
                subBranches: Number(rows[0]?.sub_branches) || 0
            };
        } finally {
            await conn.end();
        }
    }

    /**
     * Search branches by name or location
     */
    static async search(tenantDbName: string, query: string): Promise<BranchData[]> {
        const conn = await this.getTenantConnection(tenantDbName);
        try {
            const searchTerm = `%${query}%`;
            const [rows] = await conn.query<RowDataPacket[]>(
                `SELECT * FROM branches 
                WHERE is_active = TRUE 
                AND (branch_name LIKE ? OR branch_location LIKE ? OR branch_email LIKE ?)
                ORDER BY branch_name`,
                [searchTerm, searchTerm, searchTerm]
            );
            return rows as BranchData[];
        } finally {
            await conn.end();
        }
    }

    // ─── Branch Connection Methods ─────────────────────────────────────

    /**
     * Create a connection between two branches
     */
    static async createConnection(
        tenantDbName: string,
        tenantId: string,
        tenantSlug: string,
        data: {
            branch_id: string;
            connected_branch_id: string;
            connection_type: 'referral' | 'transfer' | 'partnership' | 'parent_child';
            notes?: string;
        }
    ): Promise<string> {
        const conn = await this.getTenantConnection(tenantDbName);
        try {
            const connectionId = uuidv4();
            const reverseId = uuidv4();

            // Check if connection already exists
            const [existing] = await conn.query<RowDataPacket[]>(
                `SELECT id FROM branch_connections 
                WHERE branch_id = ? AND connected_branch_id = ? AND status = 'active'`,
                [data.branch_id, data.connected_branch_id]
            );
            if (existing.length > 0) {
                throw new Error('Connection already exists');
            }

            // Create bidirectional connection
            await conn.query(
                `INSERT INTO branch_connections (
                    id, tenant_id, tenant_slug, branch_id, connected_branch_id, 
                    connection_type, status, notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, NOW(), NOW())`,
                [
                    connectionId,
                    tenantId,
                    tenantSlug,
                    data.branch_id,
                    data.connected_branch_id,
                    data.connection_type,
                    data.notes || null
                ]
            );

            await conn.query(
                `INSERT INTO branch_connections (
                    id, tenant_id, tenant_slug, branch_id, connected_branch_id, 
                    connection_type, status, notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, NOW(), NOW())`,
                [
                    reverseId,
                    tenantId,
                    tenantSlug,
                    data.connected_branch_id,
                    data.branch_id,
                    data.connection_type,
                    data.notes || null
                ]
            );

            return connectionId;
        } finally {
            await conn.end();
        }
    }

    /**
     * Get all connections for a branch
     */
    static async getConnections(tenantDbName: string, branchId: string): Promise<BranchConnectionData[]> {
        const conn = await this.getTenantConnection(tenantDbName);
        try {
            const [rows] = await conn.query<RowDataPacket[]>(
                `SELECT * FROM branch_connections 
                WHERE branch_id = ? AND status = 'active'
                ORDER BY created_at DESC`,
                [branchId]
            );
            return rows as BranchConnectionData[];
        } finally {
            await conn.end();
        }
    }

    /**
     * Get all connections for a tenant
     */
    static async getAllConnections(tenantDbName: string): Promise<BranchConnectionData[]> {
        const conn = await this.getTenantConnection(tenantDbName);
        try {
            const [rows] = await conn.query<RowDataPacket[]>(
                `SELECT * FROM branch_connections 
                WHERE status = 'active'
                ORDER BY created_at DESC`
            );
            return rows as BranchConnectionData[];
        } finally {
            await conn.end();
        }
    }

    /**
     * Check if two branches are connected
     */
    static async areConnected(
        tenantDbName: string,
        branchId: string,
        connectedBranchId: string
    ): Promise<boolean> {
        const conn = await this.getTenantConnection(tenantDbName);
        try {
            const [rows] = await conn.query<RowDataPacket[]>(
                `SELECT id FROM branch_connections 
                WHERE branch_id = ? AND connected_branch_id = ? AND status = 'active'
                LIMIT 1`,
                [branchId, connectedBranchId]
            );
            return rows.length > 0;
        } finally {
            await conn.end();
        }
    }

    /**
     * Update connection status
     */
    static async updateConnection(
        tenantDbName: string,
        connectionId: string,
        status: 'active' | 'inactive' | 'pending'
    ): Promise<boolean> {
        const conn = await this.getTenantConnection(tenantDbName);
        try {
            // Get the connection to find its reverse
            const [rows] = await conn.query<RowDataPacket[]>(
                'SELECT branch_id, connected_branch_id FROM branch_connections WHERE id = ?',
                [connectionId]
            );
            
            if (rows.length === 0) return false;

            const connection = rows[0];
            
            // Update both directions
            const [result] = await conn.query<mysql.ResultSetHeader>(
                `UPDATE branch_connections SET status = ?, updated_at = NOW() 
                WHERE (branch_id = ? AND connected_branch_id = ?) 
                OR (branch_id = ? AND connected_branch_id = ?)`,
                [
                    status,
                    connection.branch_id,
                    connection.connected_branch_id,
                    connection.connected_branch_id,
                    connection.branch_id
                ]
            );
            return result.affectedRows > 0;
        } finally {
            await conn.end();
        }
    }

    /**
     * Delete a branch connection
     */
    static async deleteConnection(tenantDbName: string, connectionId: string): Promise<boolean> {
        const conn = await this.getTenantConnection(tenantDbName);
        try {
            // Get the connection to find its reverse
            const [rows] = await conn.query<RowDataPacket[]>(
                'SELECT branch_id, connected_branch_id FROM branch_connections WHERE id = ?',
                [connectionId]
            );
            
            if (rows.length === 0) return false;

            const connection = rows[0];
            
            // Delete both directions
            const [result] = await conn.query<mysql.ResultSetHeader>(
                `DELETE FROM branch_connections 
                WHERE (branch_id = ? AND connected_branch_id = ?) 
                OR (branch_id = ? AND connected_branch_id = ?)`,
                [
                    connection.branch_id,
                    connection.connected_branch_id,
                    connection.connected_branch_id,
                    connection.branch_id
                ]
            );
            return result.affectedRows > 0;
        } finally {
            await conn.end();
        }
    }

    /**
     * Auto-connect all branches in a tenant
     */
    static async autoConnectAll(tenantDbName: string, tenantId: string, tenantSlug: string): Promise<void> {
        const conn = await this.getTenantConnection(tenantDbName);
        try {
            // Get all active branches
            const [branches] = await conn.query<RowDataPacket[]>(
                'SELECT branch_id FROM branches WHERE is_active = TRUE'
            );

            if (branches.length < 2) return;

            // Connect all branches to each other
            for (let i = 0; i < branches.length; i++) {
                for (let j = i + 1; j < branches.length; j++) {
                    const branchA = branches[i].branch_id;
                    const branchB = branches[j].branch_id;

                    // Check if already connected
                    const [existing] = await conn.query<RowDataPacket[]>(
                        `SELECT id FROM branch_connections 
                        WHERE branch_id = ? AND connected_branch_id = ?`,
                        [branchA, branchB]
                    );

                    if (existing.length === 0) {
                        await BranchModel.createConnection(
                            tenantDbName,
                            tenantId,
                            tenantSlug,
                            {
                                branch_id: branchA,
                                connected_branch_id: branchB,
                                connection_type: 'partnership',
                                notes: 'Auto-connected on tenant setup'
                            }
                        );
                    }
                }
            }

            console.log(`✅ Auto-connected ${branches.length} branches for tenant: ${tenantSlug}`);
        } finally {
            await conn.end();
        }
    }
}

export default BranchModel;