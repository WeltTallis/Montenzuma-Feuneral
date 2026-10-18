/* ============================================================================
   Production Stages — single source of truth for stage keys, names, colors.
   Update here to add/remove/reorder build stages.
   ============================================================================ */
export const STAGES = [
  { key: 'building',  name: 'Building',     icon: 'hammer',   color: '#2563EB', bg: '#EFF6FF', cls: 'stage-building'  },
  { key: 'waiting',   name: 'Waiting Bay', icon: 'clock',      color: '#D97706', bg: '#FFFBEB', cls: 'stage-waiting'   },
  { key: 'painting',  name: 'Painting',    icon: 'paint-roller',color: '#7C3AED', bg: '#F5F3FF', cls: 'stage-painting' },
  { key: 'interior',  name: 'Interior',     icon: 'couch',      color: '#0891B2', bg: '#ECFEFF', cls: 'stage-interior' },
  { key: 'store',     name: 'Store',        icon: 'warehouse', color: '#059669', bg: '#ECFDF5', cls: 'stage-store'     },
];

export const STAGE_INDEX = Object.fromEntries(STAGES.map((s, i) => [s.key, i]));

export const STAGE_DESC = {
  building:  'Cut, plane, and prepare timber',
  waiting:   'Quality check before paint',
  painting:  'Stain, lacquer, and finish',
  interior:  'Lining, handles, and upholstery',
  store:     'Stored and ready for dispatch',
};