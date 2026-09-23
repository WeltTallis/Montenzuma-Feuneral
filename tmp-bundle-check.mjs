var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// services/app-global/middlewares/authMiddleware.js
var require_authMiddleware = __commonJS({
  "services/app-global/middlewares/authMiddleware.js"(exports, module) {
    "use strict";
    var jwt = __require("jsonwebtoken");
    var mysql = __require("mysql2/promise");
    var GLOBAL_JWT_SECRET = null;
    var JWT_SECRET_RESOLVED = false;
    var getJwtSecret = () => {
      if (JWT_SECRET_RESOLVED) {
        return GLOBAL_JWT_SECRET;
      }
      GLOBAL_JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;
      if (!GLOBAL_JWT_SECRET) {
        if (process.env.NODE_ENV === "development" || process.env.DEBUG_JWT_FALLBACK === "true") {
          console.warn("WARNING: JWT_SECRET not set \u2014 using development fallback. Do NOT use in production.");
          GLOBAL_JWT_SECRET = process.env.DEV_JWT_FALLBACK || "dev_local_jwt_secret_please_change";
        } else {
          throw new Error("FATAL: JWT_SECRET environment variable is required");
        }
      }
      JWT_SECRET_RESOLVED = true;
      return GLOBAL_JWT_SECRET;
    };
    var rootPool = null;
    var getRootPool = () => {
      if (!rootPool) {
        rootPool = mysql.createPool({
          host: process.env.DB_HOST || "localhost",
          port: parseInt(process.env.DB_PORT || "3306"),
          user: process.env.DB_USER || "root",
          password: process.env.DB_PASSWORD || "",
          waitForConnections: true,
          connectionLimit: 5,
          queueLimit: 0
        });
      }
      return rootPool;
    };
    var verifyTokenWithFallback = async (token) => {
      try {
        const decoded = jwt.verify(token, getJwtSecret());
        return { decoded, error: null };
      } catch (e) {
      }
      try {
        const payload = jwt.decode(token);
        if (payload && payload.tenantId) {
          const pool = getRootPool();
          const [columns] = await pool.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = 'tenant_tracking' AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'jwt_secret'`
          );
          if (columns && columns.length > 0) {
            const [tenants] = await pool.query(
              "SELECT jwt_secret FROM tenant_tracking.tenants WHERE id = ?",
              [payload.tenantId]
            );
            if (tenants.length > 0 && tenants[0].jwt_secret) {
              try {
                const decoded = jwt.verify(token, tenants[0].jwt_secret);
                return { decoded, error: null };
              } catch (e) {
              }
            }
          }
        }
      } catch (e) {
      }
      return { decoded: null, error: "Token invalid or expired" };
    };
    var protect2 = async (req, res, next) => {
      let token;
      if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
      } else if (req.cookies?.access_token) {
        token = req.cookies.access_token;
      }
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, no token provided"
        });
      }
      try {
        getJwtSecret();
      } catch (secretError) {
        return res.status(500).json({
          success: false,
          message: secretError.message
        });
      }
      try {
        const { decoded, error } = await verifyTokenWithFallback(token);
        if (decoded) {
          req.user = decoded;
          return next();
        }
        return res.status(401).json({
          success: false,
          message: "Not authorized, token is invalid or expired"
        });
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, token verification failed"
        });
      }
    };
    var authorize = (...roles) => {
      return (req, res, next) => {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: "Not authorized, no user context"
          });
        }
        if (!roles.includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            message: `Role '${req.user.role}' is not authorized to access this resource`,
            requiredRoles: roles
          });
        }
        next();
      };
    };
    var optionalAuth = async (req, res, next) => {
      let token;
      if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
      } else if (req.cookies?.access_token) {
        token = req.cookies.access_token;
      }
      if (token) {
        try {
          const decoded = jwt.verify(token, getJwtSecret());
          req.user = decoded;
        } catch (error) {
        }
      }
      next();
    };
    var ALL_ROLES = [
      "admin",
      "superadmin",
      "systemadmin",
      "staff",
      "user",
      "manager",
      "director",
      "mortician",
      "driver",
      "tenant"
    ];
    var authorizeAny2 = (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, no user context"
        });
      }
      next();
    };
    module.exports = {
      protect: protect2,
      authorize,
      authorizeAny: authorizeAny2,
      optionalAuth,
      ALL_ROLES
    };
  }
});

// services/store-service/routes/storeRoutes.ts
var import_authMiddleware = __toESM(require_authMiddleware(), 1);
import { Router } from "express";

// services/store-service/controllers/storeController.ts
var getKnex = (req) => {
  const db = req.app?.locals?.storeKnex;
  if (!db) {
    throw new Error(
      "Store database is not available. Is MariaDB running? (mini service runs in demo-only mode)"
    );
  }
  return db;
};
var itemToJSON = (r) => ({
  id: r.id,
  name: r.name,
  category: r.category,
  unit: r.unit,
  stock: Number(r.stock),
  minStock: Number(r.min_stock)
});
var txToJSON = (r) => ({
  id: r.id,
  itemId: r.item_id,
  itemName: r.item_name,
  action: r.action,
  quantity: Number(r.quantity),
  unit: r.unit,
  staff: r.staff,
  reason: r.reason || "",
  remaining: Number(r.remaining),
  date: r.created_at
});
var ok = (res, data, extra = {}) => res.status(200).json({ success: true, ...extra, data });
var fail = (res, status, message) => res.status(status).json({ success: false, message });
var getFloat = (v) => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
};
var getItems = async (req, res) => {
  try {
    const db = getKnex(req);
    const { search, category } = req.query;
    let query = db("mini_store_items").select("id", "name", "category", "unit", "stock", "min_stock", "created_at", "updated_at").orderBy("name", "asc");
    if (search && String(search).trim()) {
      query = query.where("name", "like", `%${String(search).trim()}%`);
    }
    if (category && String(category) !== "all") {
      query = query.where("category", String(category));
    }
    const rows = await query;
    return ok(res, rows.map(itemToJSON), { count: rows.length });
  } catch (error) {
    return fail(res, 503, error.message);
  }
};
var getCategories = async (req, res) => {
  try {
    const db = getKnex(req);
    const rows = await db("mini_store_items").distinct("category").orderBy("category", "asc");
    return ok(
      res,
      rows.map((r) => r.category)
    );
  } catch (error) {
    return fail(res, 503, error.message);
  }
};
var getItemById = async (req, res) => {
  try {
    const db = getKnex(req);
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, "Invalid item id");
    const row = await db("mini_store_items").where({ id }).first();
    if (!row) return fail(res, 404, `Item ${id} not found`);
    return ok(res, itemToJSON(row));
  } catch (error) {
    return fail(res, 503, error.message);
  }
};
var createItem = async (req, res) => {
  let db;
  try {
    db = getKnex(req);
    const body = req.body || {};
    const name = String(body.name || "").trim();
    const category = String(body.category || "Other").trim();
    const unit = String(body.unit || "pcs").trim();
    const stock = Math.max(0, getFloat(body.stock) ?? 0);
    const minStock = Math.max(0, getFloat(body.minStock) ?? 0);
    if (!name) return fail(res, 400, "Item name is required");
    if (body.stock !== void 0 && getFloat(body.stock) === null)
      return fail(res, 400, "Invalid stock value");
    if (body.minStock !== void 0 && getFloat(body.minStock) === null)
      return fail(res, 400, "Invalid minStock value");
    const exists = await db("mini_store_items").where({ name }).first();
    if (exists) return fail(res, 409, `Item "${name}" already exists`);
    const insertResult = await db("mini_store_items").insert({
      name,
      category,
      unit,
      stock,
      min_stock: minStock,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    const first = Array.isArray(insertResult) ? insertResult[0] : insertResult;
    const insertId = typeof first === "number" ? first : Number(first?.insertId ?? insertResult[0]?.insertId);
    const row = await db("mini_store_items").where({ id: insertId }).first();
    if (stock > 0) {
      await db("mini_store_transactions").insert({
        item_id: row.id,
        item_name: row.name,
        action: "restocked",
        quantity: stock,
        unit: row.unit,
        staff: String(body.staff || "Store Clerk"),
        reason: "Initial stock",
        remaining: Number(row.stock),
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    return ok(res, itemToJSON(row), { message: `"${row.name}" added to the store` });
  } catch (error) {
    return fail(res, 503, error.message);
  }
};
var updateItem = async (req, res) => {
  try {
    const db = getKnex(req);
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, "Invalid item id");
    const row = await db("mini_store_items").where({ id }).first();
    if (!row) return fail(res, 404, `Item ${id} not found`);
    const body = req.body || {};
    const patch = {};
    if (body.name !== void 0) {
      const name = String(body.name).trim();
      if (!name) return fail(res, 400, "Item name cannot be empty");
      patch.name = name;
    }
    if (body.category !== void 0) patch.category = String(body.category).trim() || "Other";
    if (body.unit !== void 0) patch.unit = String(body.unit).trim() || "pcs";
    if (body.minStock !== void 0)
      patch.min_stock = Math.max(0, getFloat(body.minStock) ?? Number(row.min_stock));
    let delta = 0;
    if (body.stock !== void 0) {
      const newStock = Math.max(0, getFloat(body.stock) ?? Number(row.stock));
      delta = newStock - Number(row.stock);
      patch.stock = newStock;
    }
    await db("mini_store_items").where({ id }).update({ ...patch, updated_at: db.fn.now() });
    if (delta !== 0) {
      const updated = await db("mini_store_items").where({ id }).first();
      await db("mini_store_transactions").insert({
        item_id: id,
        item_name: updated.name,
        action: "adjusted",
        quantity: Math.abs(delta),
        unit: updated.unit,
        staff: String(body.staff || "Store Clerk"),
        reason: `Stock adjusted (${delta > 0 ? "+" : "-"}${delta} ${updated.unit}) - ${String(body.reason || "manual adjustment")}`,
        remaining: Number(updated.stock)
      });
      return ok(res, itemToJSON(updated), { message: `"${updated.name}" updated` });
    }
    const final = await db("mini_store_items").where({ id }).first();
    return ok(res, itemToJSON(final), { message: `"${final.name}" updated` });
  } catch (error) {
    return fail(res, 503, error.message);
  }
};
var deleteItem = async (req, res) => {
  try {
    const db = getKnex(req);
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, "Invalid item id");
    const row = await db("mini_store_items").where({ id }).first();
    if (!row) return fail(res, 404, `Item ${id} not found`);
    await db("mini_store_items").where({ id }).del();
    return ok(res, { id }, { message: `"${row.name}" removed from the store` });
  } catch (error) {
    return fail(res, 503, error.message);
  }
};
var pickItem = async (req, res) => {
  try {
    const db = getKnex(req);
    const id = parseInt(req.params.id, 10);
    const body = req.body || {};
    const qty = getFloat(body.quantity);
    if (!id) return fail(res, 400, "Invalid item id");
    if (qty === null || qty <= 0) return fail(res, 400, "A valid quantity is required");
    if (!body.staff) return fail(res, 400, "Staff member is required");
    if (!body.reason) return fail(res, 400, "Reason is required");
    const item = await db("mini_store_items").where({ id }).first();
    if (!item) return fail(res, 404, `Item ${id} not found`);
    const currentStock = Number(item.stock);
    if (qty > currentStock) {
      return fail(res, 409, `Not enough stock! Available: ${currentStock} ${item.unit}`);
    }
    const newStock = currentStock - qty;
    await db("mini_store_items").where({ id }).update({ stock: newStock });
    const reason = body.notes ? `${body.reason} - ${body.notes}` : body.reason;
    await db("mini_store_transactions").insert({
      item_id: id,
      item_name: item.name,
      action: "used",
      quantity: qty,
      unit: item.unit,
      staff: String(body.staff),
      reason: String(reason),
      remaining: newStock,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    const latest = await db("mini_store_transactions").where({ item_id: id, action: "used", quantity: qty, remaining: newStock }).orderBy("id", "desc").first();
    const updated = await db("mini_store_items").where({ id }).first();
    return ok(
      res,
      { item: itemToJSON(updated), transaction: latest ? txToJSON(latest) : null },
      { message: `Picked ${qty} ${item.unit} of ${item.name}` }
    );
  } catch (error) {
    return fail(res, 503, error.message);
  }
};
var restockItem = async (req, res) => {
  try {
    const db = getKnex(req);
    const id = parseInt(req.params.id, 10);
    const body = req.body || {};
    const qty = getFloat(body.quantity);
    if (!id) return fail(res, 400, "Invalid item id");
    if (qty === null || qty <= 0) return fail(res, 400, "A valid quantity is required");
    const item = await db("mini_store_items").where({ id }).first();
    if (!item) return fail(res, 404, `Item ${id} not found`);
    const newStock = Number(item.stock) + qty;
    await db("mini_store_items").where({ id }).update({ stock: newStock });
    const reason = body.supplier ? `Supplier: ${body.supplier}` : "Restocked";
    await db("mini_store_transactions").insert({
      item_id: id,
      item_name: item.name,
      action: "restocked",
      quantity: qty,
      unit: item.unit,
      staff: String(body.staff || "Store Clerk"),
      reason: String(reason),
      remaining: newStock,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    const latest = await db("mini_store_transactions").where({ item_id: id, action: "restocked", quantity: qty, remaining: newStock }).orderBy("id", "desc").first();
    const updated = await db("mini_store_items").where({ id }).first();
    return ok(
      res,
      { item: itemToJSON(updated), transaction: latest ? txToJSON(latest) : null },
      { message: `Restocked ${qty} ${item.unit} of ${item.name}` }
    );
  } catch (error) {
    return fail(res, 503, error.message);
  }
};
var adjustItem = async (req, res) => {
  try {
    const db = getKnex(req);
    const id = parseInt(req.params.id, 10);
    const body = req.body || {};
    const newStock = Math.max(0, getFloat(body.newStock) ?? 0);
    if (!id) return fail(res, 400, "Invalid item id");
    if (getFloat(body.newStock) === null) return fail(res, 400, "newStock is required");
    const item = await db("mini_store_items").where({ id }).first();
    if (!item) return fail(res, 404, `Item ${id} not found`);
    const delta = newStock - Number(item.stock);
    await db("mini_store_items").where({ id }).update({ stock: newStock });
    if (delta !== 0) {
      await db("mini_store_transactions").insert({
        item_id: id,
        item_name: item.name,
        action: "adjusted",
        quantity: Math.abs(delta),
        unit: item.unit,
        staff: String(body.staff || "Store Clerk"),
        reason: `Stock adjusted (${delta > 0 ? "+" : "-"}${delta} ${item.unit}) - ${String(body.reason || "manual adjustment")}`,
        remaining: newStock,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    const updated = await db("mini_store_items").where({ id }).first();
    return ok(res, itemToJSON(updated), { message: `"${item.name}" stock adjusted` });
  } catch (error) {
    return fail(res, 503, error.message);
  }
};
var getTransactions = async (req, res) => {
  try {
    const db = getKnex(req);
    const { action, itemId, itemName, staff, from, to, page = "1", perPage = "100" } = req.query;
    let query = db("mini_store_transactions").select("*");
    if (action && String(action) !== "all") query = query.where("action", String(action));
    if (itemId) query = query.where("item_id", parseInt(String(itemId), 10) || 0);
    if (itemName && String(itemName) !== "all") query = query.where("item_name", String(itemName));
    if (staff && String(staff) !== "all") query = query.where("staff", String(staff));
    if (from) query = query.where("created_at", ">=", /* @__PURE__ */ new Date(String(from) + "T00:00:00"));
    if (to) query = query.where("created_at", "<=", /* @__PURE__ */ new Date(String(to) + "T23:59:59"));
    const totalQ = query.clone();
    const total = (await totalQ.count("id as cnt"))[0]?.cnt ?? 0;
    const per = Math.max(1, parseInt(String(perPage), 10) || 100);
    const pg = Math.max(1, parseInt(String(page), 10) || 1);
    const totalPages = Math.max(1, Math.ceil(Number(total) / per));
    const offset = (pg - 1) * per;
    const rows = await query.orderBy("created_at", "desc").orderBy("id", "desc").limit(per).offset(offset);
    return res.status(200).json({
      success: true,
      count: rows.length,
      total: Number(total),
      page: pg,
      perPage: per,
      totalPages,
      data: rows.map(txToJSON)
    });
  } catch (error) {
    return fail(res, 503, error.message);
  }
};
var getStats = async (req, res) => {
  try {
    const db = getKnex(req);
    const [{ cnt: total }] = await db("mini_store_items").count("id as cnt");
    const lowItems = await db("mini_store_items").whereRaw("stock <= min_stock").orWhereRaw("stock = 0");
    const inStock = Number(total) - lowItems.length;
    const lowStock = lowItems.filter((i) => Number(i.stock) > 0).length;
    const outOfStock = lowItems.filter((i) => Number(i.stock) === 0).length;
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const usedTodayRows = await db("mini_store_transactions").where("action", "used").where("created_at", ">=", today);
    const stats = {
      total: Number(total),
      inStock,
      lowStock,
      outOfStock,
      usedToday: usedTodayRows.length
    };
    return ok(res, stats);
  } catch (error) {
    return fail(res, 503, error.message);
  }
};

// services/store-service/routes/storeRoutes.ts
var router = Router();
router.use(import_authMiddleware.protect);
router.use(import_authMiddleware.authorizeAny);
router.get("/stats", getStats);
router.get("/items/categories", getCategories);
router.get("/transactions", getTransactions);
router.get("/items", getItems);
router.post("/items", createItem);
router.get("/items/:id", getItemById);
router.put("/items/:id", updateItem);
router.delete("/items/:id", deleteItem);
router.post("/items/:id/pick", pickItem);
router.post("/items/:id/restock", restockItem);
router.post("/items/:id/adjust", adjustItem);
var storeRoutes_default = router;
export {
  storeRoutes_default as default
};
