import assert from 'node:assert/strict';
import { getBookingRoute } from './viewerShared.js';

assert.deepEqual(
  getBookingRoute({
    from_location: 'Nairobi Mortuary',
    to_location: 'Machakos',
    destination: 'Nairobi Mortuary → Machakos',
  }),
  { from: 'Nairobi Mortuary', to: 'Machakos' },
);

assert.deepEqual(
  getBookingRoute({
    from_location: 'Nairobi Mortuary',
    destination: 'Nairobi Mortuary → Machakos',
  }),
  { from: 'Nairobi Mortuary', to: 'Machakos' },
);

assert.deepEqual(
  getBookingRoute({ origin: 'Nairobi', destination: 'Mombasa' }),
  { from: 'Nairobi', to: 'Mombasa' },
);
