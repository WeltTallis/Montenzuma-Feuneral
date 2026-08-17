const { safeTenantQuery, safeTenantExecute } = require('../../../shared/dbConfig');

// ============================================
// RECORD CHEMICAL USAGE
// ============================================
exports.recordUsage = async (req, res) => {
  try {
    const tenantDb = req.tenant?.db_name;
    const tenantSlug = req.tenant?.tenant_slug || req.tenantSlug || 'system_shared';
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant database not resolved' });

    const { chemical_id, quantity_used, usage_notes, branch_id, reference_type, reference_id } = req.body;

    if (!chemical_id || !quantity_used || parseFloat(quantity_used) <= 0) {
      return res.status(400).json({ success: false, message: 'chemical_id and quantity_used (>0) are required' });
    }

    const effectiveBranchId = branch_id || req.branchId || 1;

    // Check chemical exists and has stock (scoped by tenant_slug)
    const chem = await safeTenantQuery(tenantDb,
      'SELECT id, current_stock, unit, name, branch_id FROM chemicals WHERE id=? AND is_active=1 AND tenant_slug=?',
      [chemical_id, tenantSlug]
    );
    if (!chem.length) return res.status(404).json({ success: false, message: 'Chemical not found' });

    if (parseFloat(chem[0].current_stock) < parseFloat(quantity_used)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${chem[0].current_stock} ${chem[0].unit}, Required: ${quantity_used} ${chem[0].unit}`,
        available_stock: chem[0].current_stock,
        required: quantity_used
      });
    }

    const previousStock = parseFloat(chem[0].current_stock);
    const qty = parseFloat(quantity_used);
    const newStock = previousStock - qty;

    // Deduct from stock
    await safeTenantExecute(tenantDb, 'UPDATE chemicals SET current_stock=? WHERE id=? AND tenant_slug=?', [newStock, chemical_id, tenantSlug]);

    // Record stock transaction
    const txnResult = await safeTenantExecute(tenantDb,
      `INSERT INTO chemical_transactions (tenant_slug, chemical_id, branch_id, transaction_type, quantity, unit, previous_stock, new_stock, reference_type, reference_id, notes)
       VALUES (?, ?, ?, 'consumed', ?, ?, ?, ?, ?, ?, ?)`,
      [tenantSlug, chemical_id, effectiveBranchId, qty, chem[0].unit, previousStock, newStock, reference_type || null, reference_id || null, usage_notes || 'General usage']
    );

    // Record the usage (generic consumption record - not deceased-specific)
    await safeTenantExecute(tenantDb,
      `INSERT INTO chemical_usage (tenant_slug, branch_id, reference_type, reference_id, chemical_id, quantity_used, unit, transaction_id, used_by, usage_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantSlug, effectiveBranchId, reference_type || null, reference_id || null, chemical_id, qty, chem[0].unit, txnResult.insertId, req.user?.id || null, usage_notes || null]
    );

    res.status(201).json({
      success: true,
      message: `Used ${qty} ${chem[0].unit} of ${chem[0].name}`,
      data: {
        chemical: chem[0].name,
        quantity_used: qty,
        unit: chem[0].unit,
        previous_stock: previousStock,
        remaining_stock: newStock
      }
    });
  } catch (error) {
    console.error('[usageController.recordUsage]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET USAGE BY REFERENCE (e.g. a deceased/case id)
// ============================================
exports.getByReference = async (req, res) => {
  try {
    const tenantDb = req.tenant?.db_name;
    const tenantSlug = req.tenant?.tenant_slug || req.tenantSlug || 'system_shared';
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant database not resolved' });

    const rows = await safeTenantQuery(tenantDb,
      `SELECT cu.*, c.name as chemical_name, c.unit, c.category, c.hazard_level
       FROM chemical_usage cu
       JOIN chemicals c ON c.id = cu.chemical_id
       WHERE cu.reference_id = ? AND cu.tenant_slug = ?
       ORDER BY cu.created_at DESC`,
      [req.params.referenceId, tenantSlug]
    );

    // Get total per chemical for this reference
    const totals = await safeTenantQuery(tenantDb,
      `SELECT c.id, c.name, c.unit, SUM(cu.quantity_used) as total_used
       FROM chemical_usage cu
       JOIN chemicals c ON c.id = cu.chemical_id
       WHERE cu.reference_id = ? AND cu.tenant_slug = ?
       GROUP BY c.id, c.name, c.unit
       ORDER BY total_used DESC`,
      [req.params.referenceId, tenantSlug]
    );

    res.json({ success: true, data: { usage: rows, totals } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET USAGE BY CHEMICAL
// ============================================
exports.getByChemical = async (req, res) => {
  try {
    const tenantDb = req.tenant?.db_name;
    const tenantSlug = req.tenant?.tenant_slug || req.tenantSlug || 'system_shared';
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant database not resolved' });

    const rows = await safeTenantQuery(tenantDb,
      `SELECT cu.*,
        c.name as chemical_name, c.unit, c.category
       FROM chemical_usage cu
       JOIN chemicals c ON c.id = cu.chemical_id
       WHERE cu.chemical_id = ? AND cu.tenant_slug = ?
       ORDER BY cu.created_at DESC`,
      [req.params.chemicalId, tenantSlug]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET USAGE REPORT
// ============================================
exports.getUsageReport = async (req, res) => {
  try {
    const tenantDb = req.tenant?.db_name;
    const tenantSlug = req.tenant?.tenant_slug || req.tenantSlug || 'system_shared';
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant database not resolved' });

    const { start_date, end_date, limit, branch_id } = req.query;
    let sql = `
      SELECT cu.id, cu.quantity_used, cu.unit, cu.created_at, cu.usage_notes, cu.branch_id,
        cu.reference_type, cu.reference_id,
        c.id as chemical_id, c.name as chemical_name, c.category
      FROM chemical_usage cu
      JOIN chemicals c ON c.id = cu.chemical_id
      WHERE cu.tenant_slug = ?`;
    const params = [tenantSlug];

    if (start_date) { sql += ' AND cu.created_at >= ?'; params.push(start_date); }
    if (end_date) { sql += ' AND cu.created_at <= ?'; params.push(end_date); }
    if (branch_id) { sql += ' AND cu.branch_id = ?'; params.push(parseInt(branch_id)); }
    else if (req.branchId) { sql += ' AND cu.branch_id = ?'; params.push(parseInt(req.branchId)); }

    sql += ' ORDER BY cu.created_at DESC';
    if (limit) sql += ' LIMIT ?';

    const rows = await safeTenantQuery(tenantDb, sql, params);
    res.json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};