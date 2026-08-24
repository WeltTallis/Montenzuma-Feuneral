const mysql = require('mysql2/promise');

(async () => {
    const c = await mysql.createConnection({
        host: '127.0.0.1', port: 3306,
        user: 'restpoint_user', password: 'RestPointUser2024',
        multipleStatements: true,
    });

    // 1. Database + tables (matches services/tenant-service/migrations/support)
    await c.query('CREATE DATABASE IF NOT EXISTS support_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await c.query('USE support_db');
    await c.query(`
        CREATE TABLE IF NOT EXISTS support_tickets (
            ticket_id INT AUTO_INCREMENT PRIMARY KEY,
            tenant_slug VARCHAR(100) NOT NULL,
            tenant_name VARCHAR(255),
            user_email VARCHAR(255),
            user_name VARCHAR(255),
            type VARCHAR(50) DEFAULT 'help',
            subject VARCHAR(500) NOT NULL,
            message TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'open',
            created_at VARCHAR(255),
            updated_at VARCHAR(255),
            INDEX idx_tenant (tenant_slug),
            INDEX idx_status (status),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await c.query(`
        CREATE TABLE IF NOT EXISTS ticket_replies (
            reply_id INT AUTO_INCREMENT PRIMARY KEY,
            ticket_id INT NOT NULL,
            user_type VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            tenant_slug VARCHAR(100) NOT NULL,
            created_at VARCHAR(255),
            FOREIGN KEY (ticket_id) REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
            INDEX idx_ticket (ticket_id),
            INDEX idx_tenant (tenant_slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 2. Seed sample tickets only if table is empty
    const [cnt] = await c.query('SELECT COUNT(*) AS n FROM support_tickets');
    if (cnt[0].n > 0) {
        console.log('Tickets already exist (' + cnt[0].n + ') — skipping seed.');
        await c.end();
        return;
    }

    const now = Date.now();
    const ago = (mins) => new Date(now - mins * 60000).toISOString().slice(0, 19).replace('T', ' ');

    const tickets = [
        { t: ['welt-tallis', 'Welt Tallis Technologies', 'sarah@welttallis.co.ke', 'Sarah Mwangi', 'bug', 'open', 'Hearse booking page crashes on submit',
            'Every time I try to book a hearse for a burial on Saturday, the page freezes after clicking Confirm. I am using Chrome on Windows 11. This is urgent — the funeral is this weekend.', 25],
          r: [['admin', 'Hi Sarah, thank you for reporting this. Could you open the browser console (F12 → Console) and tell me if you see any red errors when you click Confirm?', 20]] },
        { t: ['welt-tallis', 'Welt Tallis Technologies', 'james@welttallis.co.ke', 'James Otieno', 'help', 'in_progress', 'How do I export deceased records to Excel?',
            'I need to export all deceased records from March to an Excel file for our monthly report. Where is the export option?', 90],
          r: [['admin', 'Go to Deceased Records → use the date filter, then click the Export button at the top right. Choose Excel (.xlsx). Let me know if the button is missing for your role.', 80],
              ['tenant', 'I can see the Export button now. It works, thank you! One more thing — can I also export the payments?', 45],
              ['admin', 'Payments export is coming in the next update (about 2 weeks). I have added your request to our tracker.', 30]] },
        { t: ['mwangi-funeral-home', 'Mwangi Funeral Home', 'grace@mwangifh.com', 'Grace Wanjiru', 'feature', 'open', 'Add SMS notifications for family members',
            'It would be very helpful if the system could automatically send SMS updates to family members when the body is moved or when documents are ready.', 240], r: [] },
        { t: ['kisumu-burial-society', 'Kisumu Burial Society', 'peter@kisumubs.org', 'Peter Odhiambo', 'help', 'resolved', 'Cannot login after password change',
            'I changed my password yesterday and now I cannot login with either the old or new password.', 600],
          r: [['admin', 'Sorry about that Peter — I have reset your account. Please try logging in with the temporary password sent to your email, then change it from Settings.', 560],
              ['tenant', 'Confirmed working now. Thank you for the quick response!', 520]] },
        { t: ['nakuru-memorials', 'Nakuru Memorials Ltd', 'alice@nakurumem.or.ke', 'Alice Kamau', 'other', 'closed', 'Invoice PDF not printing logo',
            'The printed invoice does not show our company logo even though it appears on screen.', 1500],
          r: [['admin', 'This was a caching issue with uploaded logos. Please re-upload your logo under Settings → Organization and try printing again.', 1400],
              ['tenant', 'Re-uploaded and it prints perfectly now.', 1300],
              ['admin', 'Great! Closing this ticket. Reach out anytime.', 1280]] },
    ];

    for (const tk of tickets) {
        const [tn, tname, uemail, uname, type, status, subject, message, minsAgo] = tk.t;
        const [res] = await c.query(
            `INSERT INTO support_tickets (tenant_slug, tenant_name, user_email, user_name, type, subject, message, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [tn, tname, uemail, uname, type, subject, message, status, ago(minsAgo), ago(Math.max(minsAgo - 10, 1))]
        );
        const ticketId = res.insertId;
        for (const [userType, msg, m] of tk.r) {
            await c.query(
                `INSERT INTO ticket_replies (ticket_id, user_type, message, tenant_slug, created_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [ticketId, userType, msg, tn, ago(m)]
            );
        }
    }

    const [final] = await c.query('SELECT COUNT(*) AS n FROM support_tickets');
    const [rep] = await c.query('SELECT COUNT(*) AS n FROM ticket_replies');
    console.log(`Seeded ${final[0].n} tickets and ${rep[0].n} replies into support_db`);
    await c.end();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });

