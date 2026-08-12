

// One-off script: apply pending knex migrations to the live hearse database.
// Run from services/hearse-service:  node apply-migration.cjs
const knex = require('knex');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

(async () => {
    const knexInstance = knex({
        client: 'mysql2',
        connection: {
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT || '3306', 10),
            user: process.env.DB_USER || 'restpoint_user',
            password: process.env.DB_PASSWORD || 'RestPointUser2024',
            database: process.env.HEARSE_DB_NAME || 'restpoint_hearses',
            charset: 'utf8mb4'
        },
        migrations: {
            directory: path.resolve(__dirname, 'migrations'),
            tableName: 'knex_migrations',
            extension: 'js'
        },
        pool: { min: 0, max: 5 }
    });

    try {
        const [batchNo, log] = await knexInstance.migrate.latest();
        console.log('[apply-migration] batch:', batchNo, 'applied:', JSON.stringify(log));
    } catch (error) {
        console.error('[apply-migration] FAILED:', error.message);
        process.exitCode = 1;
    } finally {
        await knexInstance.destroy();
    }
})();