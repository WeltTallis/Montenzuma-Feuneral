/* ============================================================================
   Workshop Workers — used for order assignment and avatar chips.
   ============================================================================ */
export const WORKERS = [
  { id: 1, name: 'James Dean',   role: 'Master Carpenter', color: '#1E40AF' },
  { id: 2, name: 'Maya Kim',     role: 'Carver',           color: '#7C3AED' },
  { id: 3, name: 'Aaron Reed',   role: 'Painter',          color: '#0891B2' },
  { id: 4, name: 'Sarah Klein',  role: 'Upholsterer',      color: '#059669' },
  { id: 5, name: 'Liam Holt',    role: 'Finisher',         color: '#D97706' },
  { id: 6, name: 'Rina Park',    role: 'Apprentice',       color: '#DB2777' },
];

export const initials = (name) => name.split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();