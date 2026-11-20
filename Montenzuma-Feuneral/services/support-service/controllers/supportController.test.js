const assert = require('node:assert/strict');
const { before, beforeEach, test } = require('node:test');
const mysql = require('mysql2/promise');
const axios = require('axios');

const queries = [];
const responses = [];
const pool = {
    query: async (sql, params = []) => {
        queries.push({ sql, params });
        return responses.shift() || [[], []];
    },
};

mysql.createPool = () => pool;
axios.post = async () => ({ status: 200 });

let controller;
before(() => {
    controller = require('./supportController');
});

beforeEach(() => {
    queries.length = 0;
    responses.length = 0;
});

const makeResponse = () => ({
    statusCode: 200,
    body: null,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    },
});

test('ticket listing uses the authenticated tenant, ignoring query and header tenant values', async () => {
    responses.push([[], []]);
    const res = makeResponse();

    await controller.getTickets({
        user: { tenantSlug: 'claim-tenant' },
        query: { tenant: 'attacker-tenant' },
        headers: { 'x-tenant-slug': 'attacker-tenant' },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(queries[0].params[0], 'claim-tenant');
    assert.match(queries[0].sql, /r\.tenant_slug = t\.tenant_slug/);
});

test('tenant ticket replies and status changes are scoped to the claim tenant', async () => {
    responses.push([[{ ticket_id: 8, tenant_slug: 'tenant-a' }], []]);
    const replyRes = makeResponse();
    await controller.getTicketReplies({
        params: { id: '8' },
        user: { tenant_slug: 'tenant-a', role: 'tenant' },
    }, replyRes);

    assert.equal(replyRes.statusCode, 200);
    assert.deepEqual(queries[0].params, ['8', 'tenant-a']);
    assert.deepEqual(queries[1].params, ['8', 'tenant-a']);
    assert.match(queries[1].sql, /ticket_id = \? AND tenant_slug = \?/);

    queries.length = 0;
    responses.push([[], []]);
    const statusRes = makeResponse();
    await controller.updateTicketStatus({
        params: { id: '8' },
        body: { status: 'closed' },
        user: { tenantSlug: 'tenant-a', role: 'tenant' },
    }, statusRes);

    assert.equal(statusRes.statusCode, 404);
    assert.deepEqual(queries[0].params, ['8', 'tenant-a']);
    assert.match(queries[0].sql, /ticket_id = \? AND tenant_slug = \?/);
    assert.equal(queries.length, 1);
});

test('replies derive type and tenant from the authenticated principal and ticket', async () => {
    responses.push(
        [[{ ticket_id: 9, tenant_slug: 'tenant-a', status: 'open' }], []],
        [{ insertId: 31 }, []],
        [{ affectedRows: 1 }, []],
    );
    const res = makeResponse();

    await controller.replyToTicket({
        params: { id: '9' },
        body: { message: 'A reply', userType: 'admin' },
        user: { tenantSlug: 'tenant-a', role: 'tenant' },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.match(queries[0].sql, /ticket_id = \? AND tenant_slug = \?/);
    assert.deepEqual(queries[0].params, ['9', 'tenant-a']);
    assert.deepEqual(queries[1].params, ['9', 'tenant', 'A reply', 'tenant-a']);
    assert.match(queries[2].sql, /WHERE ticket_id = \? AND tenant_slug = \?/);
    assert.deepEqual(queries[2].params, ['in_progress', '9', 'tenant-a']);
});

test('only platform administrators can list tickets across tenants', async () => {
    const denied = makeResponse();
    await controller.getAllTickets({ user: { role: 'admin' } }, denied);

    assert.equal(denied.statusCode, 403);
    assert.equal(queries.length, 0);

    responses.push([[], []]);
    const allowed = makeResponse();
    await controller.getAllTickets({ user: { role: 'systemadmin' } }, allowed);

    assert.equal(allowed.statusCode, 200);
    assert.equal(queries.length, 1);
});

test('public ticket submissions do not trust tenant headers or body identity when authenticated', async () => {
    responses.push([{ insertId: 12 }, []]);
    const res = makeResponse();

    await controller.createTicket({
        body: {
            subject: 'Help',
            message: 'Please help',
            tenantSlug: 'body-tenant',
            userEmail: 'spoofed@example.test',
            userName: 'Spoofed Name',
        },
        headers: { 'x-tenant-slug': 'header-tenant' },
        user: {
            tenantSlug: 'claim-tenant',
            tenantName: 'Claim Tenant',
            email: 'verified@example.test',
            full_name: 'Verified User',
        },
    }, res);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(queries[0].params, [
        'claim-tenant',
        'Claim Tenant',
        'verified@example.test',
        'Verified User',
        'help',
        'Help',
        'Please help',
    ]);
});

test('anonymous ticket submissions are assigned to the shared queue, not a client-selected tenant', async () => {
    responses.push([{ insertId: 13 }, []]);
    const res = makeResponse();

    await controller.createTicket({
        body: {
            subject: 'Public help',
            message: 'Please help',
            tenantSlug: 'body-tenant',
            userEmail: 'contact@example.test',
            userName: 'Contact',
        },
        headers: { 'x-tenant-slug': 'header-tenant' },
    }, res);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(queries[0].params, [
        'system_shared',
        'Unknown Tenant',
        'contact@example.test',
        'Contact',
        'help',
        'Public help',
        'Please help',
    ]);
});
