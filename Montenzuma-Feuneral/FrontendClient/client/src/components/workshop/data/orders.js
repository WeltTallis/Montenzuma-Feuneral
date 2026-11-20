/* ============================================================================
   Orders — live in-memory state (mock). Replace with API calls as needed.
   ============================================================================ */
import { STAGE_INDEX } from './stages';

export let ORDERS = [
  { id: 'EC-2041', name: 'Premium Oak Casket',       client: 'Whitfield Family',  type: 'Premium',   material: 'Solid oak',         size: 'Adult',   color: 'Natural',   stage: 'building', priority: 'normal', deadline: 'Today, 5:00 PM',  workers: [1,2,3,4], progress: 35, startedAt: '08:30 AM', elapsed: '2h ago' },
  { id: 'EC-2039', name: 'Mahogany Classic',         client: 'Rosewood Funeral',  type: 'Premium',   material: 'Mahogany',          size: 'Adult',   color: 'Mahogany',  stage: 'painting', priority: 'normal', deadline: 'Today, 3:30 PM',  workers: [5,1,2,3,4], progress: 60, startedAt: '07:15 AM', elapsed: '3h 15m ago' },
  { id: 'EC-2042', name: "Child's Pine Coffin",       client: "St. Mary's Parish", type: 'Standard',  material: 'Knot-free pine',    size: 'Child',   color: 'Natural',   stage: 'interior', priority: 'rush',   deadline: 'Today, 1:00 PM',  workers: [6,2,4],    progress: 50, startedAt: '06:45 AM', elapsed: '3h 45m ago' },
  { id: 'EC-2040', name: 'Custom Rosewood Casket',    client: 'Hargrove Estate',   type: 'Custom',    material: 'Rosewood',          size: 'Adult',   color: 'Dark Cherry', stage: 'store',  priority: 'normal', deadline: 'Today, 6:00 PM',  workers: [3,5,1],    progress: 85, startedAt: 'Yesterday', elapsed: '1d ago' },
  { id: 'EC-2038', name: 'Walnut Cross Casket',       client: 'Bennett & Sons',    type: 'Premium',   material: 'Black walnut',      size: 'Adult',   color: 'Walnut',    stage: 'building', priority: 'normal', deadline: 'Tomorrow, 10:00 AM', workers: [1,2],  progress: 15, startedAt: '09:00 AM', elapsed: '1h 30m ago' },
  { id: 'EC-2037', name: 'Simple Pine Box',           client: 'Greenfield Home',   type: 'Standard',  material: 'Pine',             size: 'Adult',   color: 'Natural',   stage: 'waiting',  priority: 'normal', deadline: 'Tomorrow, 2:00 PM',  workers: [4,6],    progress: 25, startedAt: '08:00 AM', elapsed: '2h 30m ago' },
  { id: 'EC-2036', name: 'Cherrywood Premium',        client: 'Langley Funeral',   type: 'Premium',   material: 'Cherry',           size: 'Adult',   color: 'Cherry',    stage: 'painting', priority: 'normal', deadline: 'Tomorrow, 4:00 PM',  workers: [3,5],    progress: 45, startedAt: '07:30 AM', elapsed: '3h ago' },
  { id: 'EC-2035', name: 'Maple Lined Casket',        client: 'Peters Family',     type: 'Custom',    material: 'Maple',             size: 'Adult',   color: 'Honey',     stage: 'interior', priority: 'normal', deadline: 'Tomorrow, 5:00 PM',  workers: [4,6],    progress: 70, startedAt: 'Yesterday', elapsed: '1d 2h ago' },
  { id: 'EC-2034', name: 'Oak Brass-Handled',         client: 'Riverstone Co.',    type: 'Premium',   material: 'Oak',              size: 'Adult',   color: 'Golden Oak', stage: 'store',   priority: 'normal', deadline: 'Today, 7:00 PM',  workers: [1,2,3],    progress: 100, startedAt: '2 days ago', elapsed: '2d ago' },
];

export const nextOrderId = () => 'EC-' + String(2043 + ORDERS.length).padStart(4, '0');