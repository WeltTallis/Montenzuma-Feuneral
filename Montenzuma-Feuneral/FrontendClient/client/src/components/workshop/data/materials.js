/* ============================================================================
   Materials — live in-memory inventory (mock).
   ============================================================================ */
export let MATERIALS = [
  { id: 1, name: 'Oak planks',       category: 'Wood',     quantity: 78,  unit: 'pcs', minLevel: 30, perCoffin: 4 },
  { id: 2, name: 'Mahogany boards',   category: 'Wood',     quantity: 24,  unit: 'pcs', minLevel: 25, perCoffin: 4 },
  { id: 3, name: 'Pine boards',       category: 'Wood',     quantity: 8,   unit: 'pcs', minLevel: 40, perCoffin: 3 },
  { id: 4, name: 'Brass handles',     category: 'Hardware', quantity: 184, unit: 'pcs', minLevel: 40, perCoffin: 2 },
  { id: 5, name: 'Wood stain (oak)',  category: 'Finish',   quantity: 12,  unit: 'L',   minLevel: 8,  perCoffin: 0.5 },
  { id: 6, name: 'Varnish',           category: 'Finish',   quantity: 32,  unit: 'L',   minLevel: 10, perCoffin: 0.8 },
  { id: 7, name: 'Velvet lining',     category: 'Textile',  quantity: 56,  unit: 'm',   minLevel: 20, perCoffin: 2.5 },
  { id: 8, name: 'Screws (assorted)', category: 'Hardware', quantity: 1200, unit: 'pcs', minLevel: 200, perCoffin: 24 },
  { id: 9, name: 'Wood glue',         category: 'Adhesive', quantity: 4,   unit: 'L',   minLevel: 6,  perCoffin: 0.2 },
];