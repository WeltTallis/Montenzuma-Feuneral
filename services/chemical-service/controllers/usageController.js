const { safeTenantQuery, safeTenantExecute } = require('../../../shared/dbConfig');

// RECORD CHEMICAL USAGE

exports.recordUsage = async (req, res) => {

  try {

    const tenantDb = req.tenant?.db_name;
    const tenantSlug = req.tenant?.tenant_slug || req.tenantSlug || 'system_shared';
    if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant database not resolved' });

    const { chemical_id, quantity_used, usage_notes, branch_id, reference_type, reference_id, used_by } = req.body;

    if (!chemical_id || !quantity_used || parseFloat(quantity_used) <= 0) {
      return res.status(400).json({ success: false, message: 'chemical_id and quantity_used (>0) are required' });
    }

    const rawBranchId = branch_id || req.branchId || 1;
    // Chemical branch_id columns are INT, but branch system uses UUID strings.

    let effectiveBranchId = rawBranchId;

    if (isNaN(parseInt(rawBranchId)) || String(rawBranchId).length > 11) {
      effectiveBranchId = req.numericBranchId || 1;
    }

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

    // ── WHO PICKED IT ────────────────────────────────────────────────────
    // The JWT carries `userId` and `email` — there is NO `id` and NO
    // `full_name` claim. Reading `req.user.id` / `req.user.full_name` (which is
    // what this used to do) therefore always produced NULL, so every pickup was
    // recorded with no employee attached and the "who picked it" column fell
    // back to a hand-typed name or the raw email address.
    const jwtUserId = req.user?.userId || req.user?.user_id || req.user?.id || null;
    const headerUserId = req.headers?.['x-user-id'] || null;
    const employeeId = jwtUserId || headerUserId || null;

    // Resolve the REAL name from the users table. `used_by` keeps the stable
    // employee id for grouping/trends; `used_by_name` stores the name as it
    // was at the time of the pickup so historic rows never change if the
    // employee is later renamed.
    let employeeName = null;
    if (employeeId) {
      try {
        const userRows = await safeTenantQuery(
          tenantDb,
          'SELECT full_name, username, email FROM users WHERE user_id = ? LIMIT 1',
          [employeeId]
        );
        if (userRows.length) {
          employeeName = userRows[0].full_name || userRows[0].username || userRows[0].email || null;
        }
      } catch (e) {
        // A missing users table must not block the pickup being recorded.
        console.warn('[CHEMICAL] Could not resolve employee name:', e.message);
      }
    }
    // Explicit client input is the last resort, then the signed-in email.
    const rawUsedBy = typeof used_by === 'string' ? used_by.trim() : '';
    const usedByName = employeeName || rawUsedBy || req.user?.email || null;

    // Deduct from stock
    await safeTenantExecute(tenantDb, 'UPDATE chemicals SET current_stock=? WHERE id=? AND tenant_slug=?', [newStock, chemical_id, tenantSlug]);

    // Record stock transaction
    const txnResult = await safeTenantExecute(tenantDb,
      `INSERT INTO chemical_transactions (tenant_slug, chemical_id, branch_id, transaction_type, quantity, unit, previous_stock, new_stock, reference_type, reference_id, performed_by, performed_by_name, notes, created_at)
       VALUES (?, ?, ?, 'consumed', ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [tenantSlug, chemical_id, effectiveBranchId, qty, chem[0].unit, previousStock, newStock, reference_type || null, reference_id || null, employeeId, usedByName, usage_notes || 'General usage']
    );

    // Record the usage (generic consumption record - not deceased-specific)
    await safeTenantExecute(tenantDb,
      `INSERT INTO chemical_usage (tenant_slug, branch_id, reference_type, reference_id, chemical_id, quantity_used, unit, transaction_id, used_by, used_by_name, usage_notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [tenantSlug, effectiveBranchId, reference_type || null, reference_id || null, chemical_id, qty, chem[0].unit, txnResult.insertId, employeeId, usedByName, usage_notes || null]
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

// GET USAGE BY REFERENCE (e.g. a deceased/case id)

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

// GET USAGE BY CHEMICAL

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


// GET USAGE REPORT

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
    if (branch_id) {
      const parsedBranchId = parseInt(branch_id);
      if (!isNaN(parsedBranchId)) { sql += ' AND cu.branch_id = ?'; params.push(parsedBranchId); }
    } else if (req.numericBranchId) {
      sql += ' AND cu.branch_id = ?'; params.push(req.numericBranchId);
    }


    sql += ' ORDER BY cu.created_at DESC';
    if (limit) sql += ' LIMIT ?';

    const rows = await safeTenantQuery(tenantDb, sql, params);
    res.json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// USAGE TRENDS - what the "who picked how much, and when" view needs.
//
// Answers three questions the flat report cannot:
//   1. daily    - total quantity picked per day (the trend line)
//   2. employee - total per employee, with their real name from the users table
//   3. branch   - total per branch
// The employee name is resolved live from `users` and falls back to the name
// snapshotted on the row, so historic rows keep reading correctly even if the
// staff record is later deleted.
exports.getUsageTrends = async (req, res) => {
    try {
        const tenantDb = req.tenant?.db_name;
        const tenantSlug = req.tenant?.tenant_slug || req.tenantSlug || 'system_shared';
        if (!tenantDb) return res.status(400).json({ success: false, message: 'Tenant database not resolved' });

        const { start_date, end_date, branch_id, days } = req.query;

        // Defaults to the last 30 days so the endpoint is safe to call bare.
        const spanDays = Math.min(365, Math.max(1, parseInt(days, 10) || 30));
        const from = /^\d{4}-\d{2}-\d{2}$/.test(start_date || '')
            ? start_date
            : (() => { const d = new Date(); d.setDate(d.getDate() - spanDays); return d.toISOString().slice(0, 10); })();
        const to = /^\d{4}-\d{2}-\d{2}$/.test(end_date || '')
            ? end_date
            : new Date().toISOString().slice(0, 10);

        const where = ['cu.tenant_slug = ?', 'DATE(cu.created_at) BETWEEN ? AND ?'];
        const params = [tenantSlug, from, to];

        if (branch_id && String(branch_id) !== 'all') {
            const parsed = parseInt(branch_id, 10);
            if (!Number.isNaN(parsed)) { where.push('cu.branch_id = ?'); params.push(parsed); }
        }

        const whereSql = where.join(' AND ');

        // 1) Daily totals for the trend line
        const daily = await safeTenantQuery(
            tenantDb,
            `SELECT DATE(cu.created_at) AS usage_date,
                    ROUND(SUM(cu.quantity_used), 2) AS total_quantity,
                    COUNT(*) AS pickup_count
             FROM chemical_usage cu
             WHERE ${whereSql}
             GROUP BY DATE(cu.created_at)
             ORDER BY usage_date ASC`,
            params
        );

        // 2) Per-employee totals, joined to the REAL user record
        const byEmployee = await safeTenantQuery(
            tenantDb,
            `SELECT cu.used_by AS employee_id,
                    COALESCE(u.full_name, cu.used_by_name, u.username, u.email, ''Unassigned'') AS employee_name,
                    u.email AS employee_email,
                    u.role AS employee_role,
                    ROUND(SUM(cu.quantity_used), 2) AS total_quantity,
                    COUNT(*) AS pickup_count,
                    MAX(cu.created_at) AS last_pickup
             FROM chemical_usage cu
             LEFT JOIN users u ON u.user_id = cu.used_by
             WHERE ${whereSql}
             GROUP BY cu.used_by, employee_name, employee_email, employee_role
             ORDER BY total_quantity DESC`,
            params
        );

        // 3) Per-branch totals
        const byBranch = await safeTenantQuery(
            tenantDb,
            `SELECT cu.branch_id,
                    COALESCE(b.branch_name, CONCAT(''Branch '', cu.branch_id)) AS branch_name,
                    ROUND(SUM(cu.quantity_used), 2) AS total_quantity,
                    COUNT(*) AS pickup_count
             FROM chemical_usage cu
             LEFT JOIN branches b
                    ON b.branch_id = CAST(cu.branch_id AS CHAR)
                    OR b.branch_code = CAST(cu.branch_id AS CHAR)
             WHERE ${whereSql}
             GROUP BY cu.branch_id, branch_name
             ORDER BY total_quantity DESC`,
            params
        );

        // 4) Per-chemical totals for the same window
        const byChemical = await safeTenantQuery(
            tenantDb,
            `SELECT c.id AS chemical_id, c.name AS chemical_name, c.unit, c.category,
                    ROUND(SUM(cu.quantity_used), 2) AS total_quantity,
                    COUNT(*) AS pickup_count
             FROM chemical_usage cu
             JOIN chemicals c ON c.id = cu.chemical_id
             WHERE ${whereSql}
             GROUP BY c.id, c.name, c.unit, c.category
             ORDER BY total_quantity DESC`,
            params
        );

        const totals = {
            quantity: daily.reduce((s, r) => s + (Number(r.total_quantity) || 0), 0),
            pickups: daily.reduce((s, r) => s + (Number(r.pickup_count) || 0), 0),
        };
        totals.quantity = Math.round(totals.quantity * 100) / 100;

        res.json({
            success: true,
            range: { from, to },
            totals,
            daily,
            by_employee: byEmployee,
            by_branch: byBranch,
            by_chemical: byChemical,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};