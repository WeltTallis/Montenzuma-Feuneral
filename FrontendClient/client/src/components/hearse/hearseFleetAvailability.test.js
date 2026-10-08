// Unit test for the multi-date availability merge.
// No test runner is configured in this repo — run it directly with Node:
//
//     node hearseFleetAvailability.test.js
//
// Exits non-zero (and prints the failing assertion) on the first failure.
//
// The headline case is the reported bug: select 3 booking dates where ONE of
// them already has a booking → the hearse must NOT show as available. The old
// day-by-day merge failed this whenever the conflict was on the first or
// middle date (only the last date happened to work).

import assert from 'node:assert/strict';
import { mergeFleetAvailability } from './hearseFleetAvailability.js';

const EXCLUDED = ['maintenance', 'out_of_service', 'disabled'];

// Fleet: 1 = bookable, 2 = bookable, 3 = in maintenance.
const hearses = [
    { id: 1, hearse_name: 'Grace', plate_number: 'KAA 001', model: 'Toyota', status: 'available', service_charge_ksh: 20000 },
    { id: 2, hearse_name: 'Hope', plate_number: 'KAA 002', model: 'Ford', status: 'available' },
    { id: 3, hearse_name: 'Rusty', plate_number: 'KAA 003', status: 'maintenance' },
];

// Shape the batch endpoint returns after the modal normalises it: hearses not
// booked that day sit in `avail`, the booking's hearse sits in `booked`.
// Avail items are minimal on purpose — the real DTO carries the same fields as
// the fleet row (name/plate/charge), so bucket metadata winning the spread is
// a no-op there; asserting on seed data requires buckets that don't set it.
const day = (date, availIds, booked = []) => ({
    date,
    avail: availIds.map((id) => ({ id })),
    booked,
});

const booking = (hearseId, client) => ({
    hearse_id: hearseId,
    id: hearseId,
    client_name: client,
    booking_code: `BK-${hearseId}`,
});

let passed = 0;
const test = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok ${passed} - ${name}`);
};

console.log('hearseFleetAvailability');

// ── THE REPORTED BUG ────────────────────────────────────────────────────────
test('3 dates selected, hearse booked on the FIRST date → NOT available', () => {
    const m = mergeFleetAvailability(hearses, [
        day('2026-10-10', [2], [booking(1, 'Kamau')]),   // conflict here
        day('2026-10-11', [1, 2]),
        day('2026-10-12', [1, 2]),
    ], EXCLUDED);

    assert.equal(m['1'].status, 'booked', 'hearse booked on date 1 must stay booked after later days merge');
    assert.deepEqual(m['1'].bookedFor.map((b) => b.date), ['2026-10-10']);
    assert.equal(m['1'].bookedFor[0].client, 'Kamau');
    assert.equal(m['2'].status, 'available', 'unconflicted hearse stays free');
    assert.equal(m['3'].status, 'maintenance', 'excluded hearse stays excluded');
});

test('3 dates selected, hearse booked on the MIDDLE date → NOT available', () => {
    const m = mergeFleetAvailability(hearses, [
        day('2026-10-10', [1, 2]),
        day('2026-10-11', [2], [booking(1, 'Achieng')]),  // conflict here
        day('2026-10-12', [1, 2]),
    ], EXCLUDED);

    assert.equal(m['1'].status, 'booked');
    assert.deepEqual(m['1'].bookedFor.map((b) => b.date), ['2026-10-11']);
    assert.equal(m['2'].status, 'available');
});

test('3 dates selected, hearse booked on the LAST date → NOT available (old code also passed this)', () => {
    const m = mergeFleetAvailability(hearses, [
        day('2026-10-10', [1, 2]),
        day('2026-10-11', [1, 2]),
        day('2026-10-12', [2], [booking(1, 'Otieno')]),
    ], EXCLUDED);

    assert.equal(m['1'].status, 'booked');
    assert.deepEqual(m['1'].bookedFor.map((b) => b.date), ['2026-10-12']);
});

// ── surrounding behaviour that must not regress ────────────────────────────
test('hearse free on all selected dates → available with empty bookedFor', () => {
    const m = mergeFleetAvailability(hearses, [
        day('2026-10-10', [1, 2]),
        day('2026-10-11', [1, 2]),
        day('2026-10-12', [1, 2]),
    ], EXCLUDED);

    assert.equal(m['1'].status, 'available');
    assert.deepEqual(m['1'].bookedFor, []);
    assert.equal(m['2'].status, 'available');
    assert.equal(m['3'].status, 'maintenance');
});

test('hearse booked on ALL selected dates → one bookedFor entry per date', () => {
    const m = mergeFleetAvailability(hearses, [
        day('2026-10-10', [2], [booking(1, 'Kamau')]),
        day('2026-10-11', [2], [booking(1, 'Kamau')]),
        day('2026-10-12', [2], [booking(1, 'Kamau')]),
    ], EXCLUDED);

    assert.equal(m['1'].status, 'booked');
    assert.deepEqual(m['1'].bookedFor.map((b) => b.date), ['2026-10-10', '2026-10-11', '2026-10-12']);
});

test('maintenance outranks a stale booking row referencing the same hearse', () => {
    const m = mergeFleetAvailability(hearses, [
        day('2026-10-10', [1, 2], [booking(3, 'Old booking')]),
    ], EXCLUDED);

    assert.equal(m['3'].status, 'maintenance', 'out-of-service wins over booked');
    assert.equal(m['1'].status, 'available');
});

test('booked hearse absent from the fleet prop still gets a booked row', () => {
    const m = mergeFleetAvailability(hearses, [
        day('2026-10-10', [1], [booking(99, 'Walk-in')]),
    ], EXCLUDED);

    assert.equal(m['99'].status, 'booked');
    assert.equal(m['99'].hearse.client_name, 'Walk-in');
    assert.deepEqual(m['99'].bookedFor.map((b) => b.date), ['2026-10-10']);
});

test('empty / missing day results → every fleet hearse still seeded (excluded honoured)', () => {
    const m = mergeFleetAvailability(hearses, [], EXCLUDED);
    assert.equal(m['1'].status, 'available');
    assert.equal(m['2'].status, 'available');
    assert.equal(m['3'].status, 'maintenance');

    const m2 = mergeFleetAvailability(hearses, undefined, EXCLUDED);
    assert.equal(m2['1'].status, 'available');
    assert.equal(m2['3'].status, 'maintenance');
});

test('seeded hearse metadata (name, charge) survives the merge', () => {
    const m = mergeFleetAvailability(hearses, [
        day('2026-10-10', [1]),
    ], EXCLUDED);

    assert.equal(m['1'].hearse.hearse_name, 'Grace');
    assert.equal(m['1'].hearse.plate_number, 'KAA 001');
    assert.equal(m['1'].hearse.service_charge_ksh, 20000);
});

test('bucket metadata enriches the row when the backend sends extra fields', () => {
    const m = mergeFleetAvailability(hearses, [
        {
            date: '2026-10-10',
            avail: [{ id: 2, branch_name: 'Westlands', service_charge_ksh: 15000 }],
            booked: [],
        },
    ], EXCLUDED);

    assert.equal(m['2'].status, 'available');
    assert.equal(m['2'].hearse.branch_name, 'Westlands');
    assert.equal(m['2'].hearse.service_charge_ksh, 15000);
    assert.equal(m['2'].hearse.hearse_name, 'Hope', 'fields the bucket omits keep their seeded values');
});

console.log(`\n${passed} passed`);
