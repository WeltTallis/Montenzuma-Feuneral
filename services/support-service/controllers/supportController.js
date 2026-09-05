const mysql = require('mysql2/promise');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// Database migrations are handled by services/support-service/init-db.js
// using centralized migrations from services/tenant-service/migrations/support/

// GSSAPI auth plugin fix for MariaDB 10.11+
const auth_gssapi_client = function () {
    return function () {
        throw new Error('GSSAPI not supported - use mysql_native_password');
    };
};

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'restpoint_user',
    password: process.env.DB_PASSWORD || '',
    database: process.env.SUPPORT_DB_NAME || 'support_db',
    authPlugins: { auth_gssapi_client },
    connectTimeout: 10000,
    acquireTimeout: 10000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

const SOCKETIO_URL = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';

// Helper to emit socket events
const emitSocketEvent = async (event, tenantSlug, data) => {
    try {
        await axios.post(`${SOCKETIO_URL}/emit/${event}`, {
            tenantSlug,
            data: { ...data, tenant_slug: tenantSlug }
        }).catch(() => { });
    } catch (e) {
        // socket emission is non-critical
    }
};

// Create a support ticket
exports.createTicket = async (req, res) => {
    try {
        const { type, subject, message, tenantName, userEmail, userName } = req.body;
        const tenantSlug = req.headers['x-tenant-slug'] || 'system_shared';

        if (!subject || !message) {
            return res.status(400).json({ success: false, message: 'Subject and message are required' });
        }

        const [result] = await pool.query(
            `INSERT INTO support_tickets (tenant_slug, tenant_name, user_email, user_name, type, subject, message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [tenantSlug, tenantName || 'Unknown Tenant', userEmail || '', userName || '', type || 'help', subject, message]
        );

        const ticketId = result.insertId;

        // Emit socket event for real-time updates
        await emitSocketEvent('ticket_updated', tenantSlug, { ticketId, action: 'created' });

        console.log(`[Support] Ticket #${ticketId} created from ${tenantSlug}: ${subject}`);

        res.status(201).json({
            success: true,
            message: 'Ticket submitted successfully. Our team will review it shortly.',
            ticketId,
        });
    } catch (error) {
        console.error('[Support] Error creating ticket:', error);
        res.status(500).json({ success: false, message: 'Failed to submit ticket. Please try again.' });
    }
};

// Get tickets for a specific tenant (with replies)
exports.getTickets = async (req, res) => {
    try {
        const tenantSlug = req.query.tenant || req.headers['x-tenant-slug'] || 'system_shared';

        // Fetch tickets with their replies via LEFT JOIN
        const [tickets] = await pool.query(
            `SELECT t.*, r.reply_id, r.user_type, r.message AS reply_message, r.created_at AS reply_created_at
               FROM support_tickets t
               LEFT JOIN ticket_replies r ON r.ticket_id = t.ticket_id
              WHERE t.tenant_slug = ?
              ORDER BY t.created_at DESC, r.created_at ASC
              LIMIT 200`,
            [tenantSlug]
        );

        // Group flat rows into tickets with nested replies arrays
        const ticketsMap = {};
        tickets.forEach(row => {
            const tid = row.ticket_id;
            if (!ticketsMap[tid]) {
                ticketsMap[tid] = {
                    ...row,
                    replies: [],
                    reply_count: 0,
                };
                // remove join columns that don't belong on the ticket
                delete ticketsMap[tid].reply_id;
                delete ticketsMap[tid].user_type;
                delete ticketsMap[tid].reply_message;
                delete ticketsMap[tid].reply_created_at;
            }

            // If this row has reply data, push it
            if (row.reply_id) {
                ticketsMap[tid].replies.push({
                    reply_id: row.reply_id,
                    user_type: row.user_type,
                    message: row.reply_message,
                    created_at: row.reply_created_at,
                });
                ticketsMap[tid].reply_count = ticketsMap[tid].replies.length;
            }
        });

        const ticketsList = Object.values(ticketsMap);
        res.json({ success: true, tickets: ticketsList });
    } catch (error) {
        console.error('[Support] Error fetching tickets:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
    }
};

// Get all support tickets (admin view)
exports.getAllTickets = async (req, res) => {
    try {
        const [tickets] = await pool.query(
            'SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT 200'
        );
        res.json({ success: true, tickets });
    } catch (error) {
        console.error('[Support] Error fetching all tickets:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
    }
};

// Reply to a ticket
exports.replyToTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { message, userType } = req.body;
        const tenantSlug = req.headers['x-tenant-slug'] || 'system_shared';

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        // Get ticket info
        const [tickets] = await pool.query(
            'SELECT * FROM support_tickets WHERE ticket_id = ?',
            [id]
        );

        if (!tickets || tickets.length === 0) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        const ticket = tickets[0];

        // Store reply
        await pool.query(
            `INSERT INTO ticket_replies (ticket_id, user_type, message, tenant_slug)
       VALUES (?, ?, ?, ?)`,
            [id, userType || 'tenant', message.trim(), tenantSlug]
        );

        // Update ticket status if it was open
        if (ticket.status === 'open') {
            await pool.query(
                'UPDATE support_tickets SET status = ? WHERE ticket_id = ?',
                ['in_progress', id]
            );
        }

        // Emit socket events for real-time updates
        await emitSocketEvent('ticket_response', ticket.tenant_slug || tenantSlug, {
            ticketId: id,
            message: `New reply on ticket #${id}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
            userType: userType || 'tenant',
        });

        await emitSocketEvent('ticket_updated', ticket.tenant_slug || tenantSlug, {
            ticketId: id,
            action: 'replied',
        });

        console.log(`[Support] Reply added to ticket #${id} by ${userType || 'tenant'}`);

        res.json({ success: true, message: 'Reply added' });
    } catch (error) {
        console.error('[Support] Error replying to ticket:', error);
        res.status(500).json({ success: false, message: 'Failed to add reply' });
    }
};

// Update ticket status
exports.updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const [tickets] = await pool.query(
            'SELECT * FROM support_tickets WHERE ticket_id = ?',
            [id]
        );

        if (!tickets || tickets.length === 0) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        await pool.query(
            'UPDATE support_tickets SET status = ? WHERE ticket_id = ?',
            [status, id]
        );

        const ticket = tickets[0];
        await emitSocketEvent('ticket_updated', ticket.tenant_slug || 'system_shared', {
            ticketId: id,
            status,
            action: 'status_change',
        });

        res.json({ success: true, message: 'Ticket updated' });
    } catch (error) {
        console.error('[Support] Error updating ticket:', error);
        res.status(500).json({ success: false, message: 'Failed to update ticket' });
    }
};

// Get replies for a ticket
exports.getTicketReplies = async (req, res) => {
    try {
        const { id } = req.params;
        const [replies] = await pool.query(
            'SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC',
            [id]
        );

        res.json({ success: true, replies });
    } catch (error) {
        console.error('[Support] Error fetching replies:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch replies' });
    }
};