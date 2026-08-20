import type { Request, Response } from 'express';
import type { ResultSetHeader } from 'mysql2';
import type { Knex } from 'knex';
import type {
  CreateItemDTO,
  MovementDTO,
  AdjustDTO,
  StatsResult,
  StoreItemRecord,
  StoreTransactionRecord,
} from '../models/storeModels.ts';

// ============================================
// HELPERS
// ============================================

/**
 * Mini Service style: controllers are fully self-contained.
 * They grab the knex instance that `server.ts` mounted on `app.locals`.
 */
const getKnex = (req: any): Knex => {
  const db = req.app?.locals?.storeKnex as Knex | null;
  if (!db) {
    throw new Error(
      'Store database is not available. Is MariaDB running? (mini service runs in demo-only mode)',
    );
  }
  return db;
};

const itemToJSON = (r: StoreItemRecord) => ({
  id: r.id,
  name: r.name,
  category: r.category,
  unit: r.unit,
  stock: Number(r.stock),
  minStock: Number(r.min_stock),
});

const txToJSON = (r: StoreTransactionRecord) => ({
  id: r.id,
  itemId: r.item_id,
  itemName: r.item_name,
  action: r.action,
  quantity: Number(r.quantity),
  unit: r.unit,
  staff: r.staff,
  reason: r.reason || '',
  remaining: Number(r.remaining),
  date: r.created_at,
});

const ok = (res: Response, data: any, extra: any = {}) =>
  res.status(200).json({ success: true, ...extra, data });

const fail = (res: Response, status: number, message: string) =>
  res.status(status).json({ success: false, message });

const getFloat = (v: any): number | null => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
};

// ============================================
// ITEMS
// ============================================

/** GET /api/store/items?search=&category= */
export const getItems = async (req: any, res: any): Promise<any> => {
  try {
    const db = getKnex(req);
    const { search, category } = req.query;

    let query = db('mini_store_items')
      .select('id', 'name', 'category', 'unit', 'stock', 'min_stock', 'created_at', 'updated_at')
      .orderBy('name', 'asc');

    if (search && String(search).trim()) {
      query = query.where('name', 'like', `%${String(search).trim()}%`);
    }
    if (category && String(category) !== 'all') {
      query = query.where('category', String(category));
    }

    const rows = (await query) as StoreItemRecord[];
    return ok(res, rows.map(itemToJSON), { count: rows.length });
  } catch (error: any) {
    return fail(res, 503, error.message);
  }
};

/** GET /api/store/items/categories */
export const getCategories = async (req: any, res: any): Promise<any> => {
  try {
    const db = getKnex(req);
    const rows = await db('mini_store_items').distinct('category').orderBy('category', 'asc');
    return ok(
      res,
      rows.map((r: any) => r.category),
    );
  } catch (error: any) {
    return fail(res, 503, error.message);
  }
};

/** GET /api/store/items/:id */
export const getItemById = async (req: any, res: any): Promise<any> => {
  try {
    const db = getKnex(req);
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, 'Invalid item id');

    const row = (await db('mini_store_items').where({ id }).first()) as StoreItemRecord | undefined;
    if (!row) return fail(res, 404, `Item ${id} not found`);
    return ok(res, itemToJSON(row));
  } catch (error: any) {
    return fail(res, 503, error.message);
  }
};

/** POST /api/store/items  body: { name, category, unit, stock, minStock } */
export const createItem = async (req: any, res: any): Promise<any> => {
  let db: Knex;
  try {
    db = getKnex(req);
    const body: CreateItemDTO = req.body || {};
    const name = String(body.name || '').trim();
    const category = String(body.category || 'Other').trim();
    const unit = String(body.unit || 'pcs').trim();
    const stock = Math.max(0, getFloat(body.stock) ?? 0);
    const minStock = Math.max(0, getFloat(body.minStock) ?? 0);

    if (!name) return fail(res, 400, 'Item name is required');
    if (body.stock !== undefined && getFloat(body.stock) === null)
      return fail(res, 400, 'Invalid stock value');
    if (body.minStock !== undefined && getFloat(body.minStock) === null)
      return fail(res, 400, 'Invalid minStock value');

    const exists = await db('mini_store_items').where({ name }).first();
    if (exists) return fail(res, 409, `Item "${name}" already exists`);

    const insertResult = (await db('mini_store_items').insert({
      name,
      category,
      unit,
      stock,
      min_stock: minStock,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })) as ResultSetHeader | ResultSetHeader[] | number[];

    // knex + mysql2 resolves .insert() to an array of insert ids ([insertId]),
    // while mysql2's raw ResultSetHeader carries .insertId. Handle both.
    const first: any = Array.isArray(insertResult) ? insertResult[0] : insertResult;
    const insertId: number =
      typeof first === 'number' ? first : Number(first?.insertId ?? insertResult[0]?.insertId);

    const row = (await db('mini_store_items').where({ id: insertId }).first()) as StoreItemRecord;

    if (stock > 0) {
      await db('mini_store_transactions').insert({
        item_id: row.id,
        item_name: row.name,
        action: 'restocked',
        quantity: stock,
        unit: row.unit,
        staff: String(body.staff || 'Store Clerk'),
        reason: 'Initial stock',
        remaining: Number(row.stock),
        created_at: new Date().toISOString(),
      });
    }

    return ok(res, itemToJSON(row), { message: `"${row.name}" added to the store` });
  } catch (error: any) {
    return fail(res, 503, error.message);
  }
};

/** PUT /api/store/items/:id  body: { name?, category?, unit?, minStock?, stock?, staff?, reason? } */
export const updateItem = async (req: any, res: any): Promise<any> => {
  try {
    const db = getKnex(req);
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, 'Invalid item id');

    const row = (await db('mini_store_items').where({ id }).first()) as StoreItemRecord | undefined;
    if (!row) return fail(res, 404, `Item ${id} not found`);

    const body = req.body || {};
    const patch: any = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return fail(res, 400, 'Item name cannot be empty');
      patch.name = name;
    }
    if (body.category !== undefined) patch.category = String(body.category).trim() || 'Other';
    if (body.unit !== undefined) patch.unit = String(body.unit).trim() || 'pcs';
    if (body.minStock !== undefined)
      patch.min_stock = Math.max(0, getFloat(body.minStock) ?? Number(row.min_stock));

    let delta = 0;
    if (body.stock !== undefined) {
      const newStock = Math.max(0, getFloat(body.stock) ?? Number(row.stock));
      delta = newStock - Number(row.stock);
      patch.stock = newStock;
    }

    await db('mini_store_items')
      .where({ id })
      .update({ ...patch, updated_at: db.fn.now() });

    if (delta !== 0) {
      const updated = (await db('mini_store_items').where({ id }).first()) as StoreItemRecord;
      await db('mini_store_transactions').insert({
        item_id: id,
        item_name: updated.name,
        action: 'adjusted',
        quantity: Math.abs(delta),
        unit: updated.unit,
        staff: String(body.staff || 'Store Clerk'),
        reason: `Stock adjusted (${delta > 0 ? '+' : '-'}${delta} ${updated.unit}) - ${String(body.reason || 'manual adjustment')}`,
        remaining: Number(updated.stock),
      });
      return ok(res, itemToJSON(updated), { message: `"${updated.name}" updated` });
    }

    const final = (await db('mini_store_items').where({ id }).first()) as StoreItemRecord;
    return ok(res, itemToJSON(final), { message: `"${final.name}" updated` });
  } catch (error: any) {
    return fail(res, 503, error.message);
  }
};

/** DELETE /api/store/items/:id */
export const deleteItem = async (req: any, res: any): Promise<any> => {
  try {
    const db = getKnex(req);
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, 'Invalid item id');

    const row = (await db('mini_store_items').where({ id }).first()) as StoreItemRecord | undefined;
    if (!row) return fail(res, 404, `Item ${id} not found`);

    await db('mini_store_items').where({ id }).del();
    return ok(res, { id }, { message: `"${row.name}" removed from the store` });
  } catch (error: any) {
    return fail(res, 503, error.message);
  }
};

// ============================================
// STOCK MOVEMENT
// ============================================

/** POST /api/store/items/:id/pick  body: { quantity, staff, reason, notes } */
export const pickItem = async (req: any, res: any): Promise<any> => {
  try {
    const db = getKnex(req);
    const id = parseInt(req.params.id, 10);
    const body: MovementDTO = req.body || {};
    const qty = getFloat(body.quantity);

    if (!id) return fail(res, 400, 'Invalid item id');
    if (qty === null || qty <= 0) return fail(res, 400, 'A valid quantity is required');
    if (!body.staff) return fail(res, 400, 'Staff member is required');
    if (!body.reason) return fail(res, 400, 'Reason is required');

    const item = (await db('mini_store_items').where({ id }).first()) as
      StoreItemRecord | undefined;
    if (!item) return fail(res, 404, `Item ${id} not found`);

    const currentStock = Number(item.stock);
    if (qty > currentStock) {
      return fail(res, 409, `Not enough stock! Available: ${currentStock} ${item.unit}`);
    }

    const newStock = currentStock - qty;
    await db('mini_store_items').where({ id }).update({ stock: newStock });

    const reason = body.notes ? `${body.reason} - ${body.notes}` : body.reason;
    await db('mini_store_transactions').insert({
      item_id: id,
      item_name: item.name,
      action: 'used',
      quantity: qty,
      unit: item.unit,
      staff: String(body.staff),
      reason: String(reason),
      remaining: newStock,
      created_at: new Date().toISOString(),
    });

    const latest = (await db('mini_store_transactions')
      .where({ item_id: id, action: 'used', quantity: qty, remaining: newStock })
      .orderBy('id', 'desc')
      .first()) as StoreTransactionRecord | undefined;
    const updated = (await db('mini_store_items').where({ id }).first()) as StoreItemRecord;

    return ok(
      res,
      { item: itemToJSON(updated), transaction: latest ? txToJSON(latest) : null },
      { message: `Picked ${qty} ${item.unit} of ${item.name}` },
    );
  } catch (error: any) {
    return fail(res, 503, error.message);
  }
};

/** POST /api/store/items/:id/restock  body: { quantity, staff, supplier } */
export const restockItem = async (req: any, res: any): Promise<any> => {
  try {
    const db = getKnex(req);
    const id = parseInt(req.params.id, 10);
    const body: MovementDTO = req.body || {};
    const qty = getFloat(body.quantity);

    if (!id) return fail(res, 400, 'Invalid item id');
    if (qty === null || qty <= 0) return fail(res, 400, 'A valid quantity is required');

    const item = (await db('mini_store_items').where({ id }).first()) as
      StoreItemRecord | undefined;
    if (!item) return fail(res, 404, `Item ${id} not found`);

    const newStock = Number(item.stock) + qty;
    await db('mini_store_items').where({ id }).update({ stock: newStock });

    const reason = body.supplier ? `Supplier: ${body.supplier}` : 'Restocked';
    await db('mini_store_transactions').insert({
      item_id: id,
      item_name: item.name,
      action: 'restocked',
      quantity: qty,
      unit: item.unit,
      staff: String(body.staff || 'Store Clerk'),
      reason: String(reason),
      remaining: newStock,
      created_at: new Date().toISOString(),
    });

    const latest = (await db('mini_store_transactions')
      .where({ item_id: id, action: 'restocked', quantity: qty, remaining: newStock })
      .orderBy('id', 'desc')
      .first()) as StoreTransactionRecord | undefined;
    const updated = (await db('mini_store_items').where({ id }).first()) as StoreItemRecord;

    return ok(
      res,
      { item: itemToJSON(updated), transaction: latest ? txToJSON(latest) : null },
      { message: `Restocked ${qty} ${item.unit} of ${item.name}` },
    );
  } catch (error: any) {
    return fail(res, 503, error.message);
  }
};

/** POST /api/store/items/:id/adjust  body: { newStock, staff, reason } */
export const adjustItem = async (req: any, res: any): Promise<any> => {
  try {
    const db = getKnex(req);
    const id = parseInt(req.params.id, 10);
    const body: AdjustDTO = req.body || {};
    const newStock = Math.max(0, getFloat(body.newStock) ?? 0);
    if (!id) return fail(res, 400, 'Invalid item id');
    if (getFloat(body.newStock) === null) return fail(res, 400, 'newStock is required');

    const item = (await db('mini_store_items').where({ id }).first()) as
      StoreItemRecord | undefined;
    if (!item) return fail(res, 404, `Item ${id} not found`);

    const delta = newStock - Number(item.stock);
    await db('mini_store_items').where({ id }).update({ stock: newStock });

    if (delta !== 0) {
      await db('mini_store_transactions').insert({
        item_id: id,
        item_name: item.name,
        action: 'adjusted',
        quantity: Math.abs(delta),
        unit: item.unit,
        staff: String(body.staff || 'Store Clerk'),
        reason: `Stock adjusted (${delta > 0 ? '+' : '-'}${delta} ${item.unit}) - ${String(body.reason || 'manual adjustment')}`,
        remaining: newStock,
        created_at: new Date().toISOString(),
      });
    }
    const updated = (await db('mini_store_items').where({ id }).first()) as StoreItemRecord;
    return ok(res, itemToJSON(updated), { message: `"${item.name}" stock adjusted` });
  } catch (error: any) {
    return fail(res, 503, error.message);
  }
};

// ============================================
// HISTORY & STATS
// ============================================

/** GET /api/store/transactions */
export const getTransactions = async (req: any, res: any): Promise<any> => {
  try {
    const db = getKnex(req);
    const { action, itemId, itemName, staff, from, to, page = '1', perPage = '100' } = req.query;

    let query = db('mini_store_transactions').select('*');
    if (action && String(action) !== 'all') query = query.where('action', String(action));
    if (itemId) query = query.where('item_id', parseInt(String(itemId), 10) || 0);
    if (itemName && String(itemName) !== 'all') query = query.where('item_name', String(itemName));
    if (staff && String(staff) !== 'all') query = query.where('staff', String(staff));
    if (from) query = query.where('created_at', '>=', new Date(String(from) + 'T00:00:00'));
    if (to) query = query.where('created_at', '<=', new Date(String(to) + 'T23:59:59'));

    const totalQ = query.clone();
    const total = (await totalQ.count('id as cnt'))[0]?.cnt ?? 0;

    const per = Math.max(1, parseInt(String(perPage), 10) || 100);
    const pg = Math.max(1, parseInt(String(page), 10) || 1);
    const totalPages = Math.max(1, Math.ceil(Number(total) / per));
    const offset = (pg - 1) * per;

    const rows = (await query
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .limit(per)
      .offset(offset)) as StoreTransactionRecord[];

    return res.status(200).json({
      success: true,
      count: rows.length,
      total: Number(total),
      page: pg,
      perPage: per,
      totalPages,
      data: rows.map(txToJSON),
    });
  } catch (error: any) {
    return fail(res, 503, error.message);
  }
};

/** GET /api/store/stats */
export const getStats = async (req: any, res: any): Promise<any> => {
  try {
    const db = getKnex(req);
    const [{ cnt: total }] = (await db('mini_store_items').count('id as cnt')) as any[];
    const lowItems = (await db('mini_store_items')
      .whereRaw('stock <= min_stock')
      .orWhereRaw('stock = 0')) as StoreItemRecord[];
    const inStock = Number(total) - lowItems.length;
    const lowStock = lowItems.filter((i) => Number(i.stock) > 0).length;
    const outOfStock = lowItems.filter((i) => Number(i.stock) === 0).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const usedTodayRows = (await db('mini_store_transactions')
      .where('action', 'used')
      .where('created_at', '>=', today)) as StoreTransactionRecord[];

    const stats: StatsResult = {
      total: Number(total),
      inStock,
      lowStock,
      outOfStock,
      usedToday: usedTodayRows.length,
    };
    return ok(res, stats);
  } catch (error: any) {
    return fail(res, 503, error.message);
  }
};
