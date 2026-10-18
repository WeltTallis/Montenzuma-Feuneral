/* ============================================================================
   API Response Transformers
   Convert raw API responses into the shapes the views expect.
   Keeps views free from API-specific field names.
   ============================================================================ */

const AVATAR_COLORS = ['#1E40AF', '#7C3AED', '#0891B2', '#059669', '#D97706', '#DB2777', '#EA580C', '#0D9488'];

export const transformWorker = (w) => ({
  id: w.user_id || w.id,
  name: w.full_name || `${w.first_name || ''} ${w.last_name || ''}`.trim() || 'Unknown',
  role: w.role || 'Worker',
  email: w.email,
  phone: w.phone,
  createdAt: w.created_at,
  color: AVATAR_COLORS[(w.user_id || w.id) % AVATAR_COLORS.length],
});

const STATUS_TO_STAGE = {
  'pending': 'building', 'building': 'building', 'design': 'building',
  'waiting_bay': 'waiting', 'waiting': 'waiting', 'inspection': 'waiting',
  'painting': 'painting',
  'interior': 'interior', 'upholstery': 'interior',
  'completed': 'store', 'delivered': 'store', 'store': 'store',
};

export const transformOrder = (o) => {
  const statusLower = (o.status || 'pending').toLowerCase();
  return {
    id: o.order_number || `CF-${o.id}`,
    dbId: o.id,
    name: o.coffin_name || 'Unnamed',
    type: o.coffin_type || 'Standard',
    size: o.size || 'Standard',
    color: o.color || 'Natural',
    status: o.status || 'pending',
    stage: STATUS_TO_STAGE[statusLower] || 'building',
    priority: o.priority || 'normal',
    assignedTo: o.assigned_to,
    assignedToName: o.assigned_to_name,
    createdAt: o.order_date ? new Date(o.order_date) : new Date(),
    updatedAt: o.updated_at ? new Date(o.updated_at) : new Date(),
    dueDate: o.due_date ? new Date(o.due_date) : null,
    branchId: o.branch_id,
    notes: o.notes,
    stages: o.stages || [],
    assignments: o.assignments || [],
    materials: o.materials_used || [],
  };
};

export const transformMaterial = (m) => ({
  id: m.id,
  name: m.name,
  category: m.category,
  quantity: parseFloat(m.quantity) || 0,
  unit: m.unit || 'pcs',
  minLevel: parseFloat(m.min_stock_level) || 10,
  costPerUnit: parseFloat(m.unit_price) || 0,
  description: m.description,
  createdAt: m.created_at,
});

export const initials = (name) =>
  name.split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();