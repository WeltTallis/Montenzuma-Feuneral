import { RowDataPacket } from 'mysql2';
import * as mysql from 'mysql2/promise';
import { TenantModel, Tenant } from './Tenant.model';

export interface Organization extends Omit<Tenant, 'tenant_id' | 'subscription_status' | 'subscription_expires_at'> {
    // Organization-specific fields
    tenant_id: string;
    organization_name?: string; // Alias for tenant_name
    slug?: string; // Alias for tenant_slug
    is_active?: boolean;
    deleted_at?: Date | null;
}

// Define the pool type
type Pool = mysql.Pool;

let cachedPool: Pool | null = null;

async function getServerPool(): Promise<Pool> {
    if (cachedPool) return cachedPool;
    
    const pool = mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'restpoint_user',
        password: process.env.DB_PASSWORD,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
    });
    
    cachedPool = pool;
    return pool;
}

export class OrganizationModel {
    
    private async getConnection(): Promise<Pool> {
        return await getServerPool();
    }

    private mapToOrganization(row: any): Organization {
        return {
            tenant_id: row.id || row.tenant_id,
            tenant_name: row.tenant_name,
            organization_name: row.tenant_name,
            tenant_slug: row.tenant_slug,
            slug: row.tenant_slug,
            tenant_code: row.tenant_code || null,
            db_name: row.db_name,
            email: row.email,
            phone: row.phone || null,
            location: row.location || null,
            country: row.country || null,
            logo_url: row.logo_url || null,
            status: row.status || 'active',
            deployment_type: row.deployment_type || 'single',
            is_active: row.status === 'active',
            created_at: row.created_at,
            updated_at: row.updated_at,
            deleted_at: row.deleted_at || null
        };
    }

    /**
     * Find organization by email
     */
    async findByEmail(email: string): Promise<Organization | null> {
        const pool = await this.getConnection();
        try {
            const [rows] = await pool.query<RowDataPacket[]>(
                `SELECT 
                    id,
                    tenant_name,
                    tenant_slug,
                    db_name,
                    tenant_code,
                    email,
                    phone,
                    location,
                    country,
                    logo_url,
                    status,
                    deployment_type,
                    created_at,
                    updated_at
                FROM tenant_tracking.tenants 
                WHERE email = ? AND status != 'deleted'`,
                [email]
            );
            
            if (!rows || rows.length === 0) return null;
            return this.mapToOrganization(rows[0]);
        } catch (error) {
            console.error('Error in findByEmail:', error);
            return null;
        }
    }

    /**
     * Find organization by ID (UUID)
     */
    async findById(id: string): Promise<Organization | null> {
        const pool = await this.getConnection();
        try {
            const [rows] = await pool.query<RowDataPacket[]>(
                `SELECT 
                    id,
                    tenant_name,
                    tenant_slug,
                    db_name,
                    tenant_code,
                    email,
                    phone,
                    location,
                    country,
                    logo_url,
                    status,
                    deployment_type,
                    created_at,
                    updated_at
                FROM tenant_tracking.tenants 
                WHERE id = ? AND status != 'deleted'`,
                [id]
            );
            
            if (!rows || rows.length === 0) return null;
            return this.mapToOrganization(rows[0]);
        } catch (error) {
            console.error('Error in findById:', error);
            return null;
        }
    }

    /**
     * Find organization by slug
     */
    async findBySlug(slug: string): Promise<Organization | null> {
        const pool = await this.getConnection();
        try {
            const [rows] = await pool.query<RowDataPacket[]>(
                `SELECT 
                    id,
                    tenant_name,
                    tenant_slug,
                    db_name,
                    tenant_code,
                    email,
                    phone,
                    location,
                    country,
                    logo_url,
                    status,
                    deployment_type,
                    created_at,
                    updated_at
                FROM tenant_tracking.tenants 
                WHERE tenant_slug = ? AND status != 'deleted'`,
                [slug]
            );
            
            if (!rows || rows.length === 0) return null;
            return this.mapToOrganization(rows[0]);
        } catch (error) {
            console.error('Error in findBySlug:', error);
            return null;
        }
    }

    /**
     * Create a new organization (uses TenantModel.registerTenant)
     */
    async create(data: {
        organization_name: string;
        email: string;
        password: string;
        full_name: string;
        phone?: string;
        location?: string;
        country?: string;
        deployment_type?: 'single' | 'multi';
        logo_url?: string | null;
        branches?: Array<{
            branch_name: string;
            branch_location: string;
            branch_phone: string;
            branch_email: string;
        }>;
    }): Promise<{ tenant: Tenant; token: string }> {
        return await TenantModel.registerTenant({
            tenant_name: data.organization_name,
            email: data.email,
            password: data.password,
            full_name: data.full_name,
            phone: data.phone,
            location: data.location,
            country: data.country,
            deployment_type: data.deployment_type || 'single',
            logo_url: data.logo_url,
            branches: data.branches
        });
    }

    /**
     * Update organization
     */
    async update(id: string, data: Partial<Organization>): Promise<boolean> {
        const pool = await this.getConnection();
        const fields: string[] = [];
        const values: any[] = [];

        if (data.organization_name || data.tenant_name) {
            fields.push('tenant_name = ?');
            values.push(data.organization_name || data.tenant_name);
        }
        if (data.email) {
            fields.push('email = ?');
            values.push(data.email);
        }
        if (data.phone !== undefined) {
            fields.push('phone = ?');
            values.push(data.phone);
        }
        if (data.location !== undefined) {
            fields.push('location = ?');
            values.push(data.location);
        }
        if (data.country !== undefined) {
            fields.push('country = ?');
            values.push(data.country);
        }
        if (data.logo_url !== undefined) {
            fields.push('logo_url = ?');
            values.push(data.logo_url);
        }
        if (data.status !== undefined) {
            fields.push('status = ?');
            values.push(data.status);
        }
        if (data.deployment_type !== undefined) {
            fields.push('deployment_type = ?');
            values.push(data.deployment_type);
        }

        if (fields.length === 0) return false;

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        try {
            const [result] = await pool.query<mysql.ResultSetHeader>(
                `UPDATE tenant_tracking.tenants SET ${fields.join(', ')} WHERE id = ?`,
                values
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in update:', error);
            return false;
        }
    }

    /**
     * Soft delete organization
     */
    async softDelete(id: string): Promise<boolean> {
        const pool = await this.getConnection();
        try {
            const [result] = await pool.query<mysql.ResultSetHeader>(
                `UPDATE tenant_tracking.tenants SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in softDelete:', error);
            return false;
        }
    }

    /**
     * Get all organizations
     */
    async findAll(limit: number = 100, offset: number = 0): Promise<Organization[]> {
        const pool = await this.getConnection();
        try {
            const [rows] = await pool.query<RowDataPacket[]>(
                `SELECT 
                    id,
                    tenant_name,
                    tenant_slug,
                    db_name,
                    tenant_code,
                    email,
                    phone,
                    location,
                    country,
                    logo_url,
                    status,
                    deployment_type,
                    created_at,
                    updated_at
                FROM tenant_tracking.tenants 
                WHERE status != 'deleted'
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?`,
                [limit, offset]
            );
            
            return rows.map((row: any) => this.mapToOrganization(row));
        } catch (error) {
            console.error('Error in findAll:', error);
            return [];
        }
    }

    /**
     * Count total organizations
     */
    async count(): Promise<number> {
        const pool = await this.getConnection();
        try {
            const [rows] = await pool.query<RowDataPacket[]>(
                'SELECT COUNT(*) as count FROM tenant_tracking.tenants WHERE status != "deleted"'
            );
            return rows[0]?.count || 0;
        } catch (error) {
            console.error('Error in count:', error);
            return 0;
        }
    }

    /**
     * Get organization with branches
     */
    async findWithBranches(id: string): Promise<{ organization: Organization; branches: any[] } | null> {
        const pool = await this.getConnection();
        try {
            const [orgRows] = await pool.query<RowDataPacket[]>(
                `SELECT 
                    id,
                    tenant_name,
                    tenant_slug,
                    db_name,
                    tenant_code,
                    email,
                    phone,
                    location,
                    country,
                    logo_url,
                    status,
                    deployment_type,
                    created_at,
                    updated_at
                FROM tenant_tracking.tenants 
                WHERE id = ? AND status != 'deleted'`,
                [id]
            );
            
            if (!orgRows || orgRows.length === 0) return null;
            
            const organization = this.mapToOrganization(orgRows[0]);

            const [branchRows] = await pool.query<RowDataPacket[]>(
                `SELECT 
                    id,
                    branch_name,
                    branch_slug,
                    branch_db_name,
                    parent_branch_id,
                    is_active
                FROM tenant_tracking.branches 
                WHERE tenant_id = ? AND is_active = 1`,
                [id]
            );

            return {
                organization,
                branches: branchRows
            };
        } catch (error) {
            console.error('Error in findWithBranches:', error);
            return null;
        }
    }

    /**
     * Get organization statistics
     */
    async getStats(id: string): Promise<{
        totalBranches: number;
        activeBranches: number;
        deploymentType: string;
        totalUsers: number;
    }> {
        const pool = await this.getConnection();
        try {
            const [tenantRows] = await pool.query<RowDataPacket[]>(
                `SELECT deployment_type FROM tenant_tracking.tenants WHERE id = ?`,
                [id]
            );
            
            const [branchRows] = await pool.query<RowDataPacket[]>(
                `SELECT COUNT(*) as total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active 
                FROM tenant_tracking.branches WHERE tenant_id = ?`,
                [id]
            );
            
            const [userRows] = await pool.query<RowDataPacket[]>(
                `SELECT COUNT(*) as total FROM tenant_tracking.users WHERE tenant_id = ? AND is_active = 1`,
                [id]
            );
            
            const tenant = tenantRows[0] || { deployment_type: 'single' };
            const branchStats = branchRows[0] || { total: 0, active: 0 };
            const userStats = userRows[0] || { total: 0 };
            
            return {
                totalBranches: Number(branchStats.total) || 0,
                activeBranches: Number(branchStats.active) || 0,
                deploymentType: tenant.deployment_type || 'single',
                totalUsers: Number(userStats.total) || 0
            };
        } catch (error) {
            console.error('Error in getStats:', error);
            return {
                totalBranches: 0,
                activeBranches: 0,
                deploymentType: 'single',
                totalUsers: 0
            };
        }
    }

    /**
     * Search organizations by name or email
     */
    async search(query: string, limit: number = 20): Promise<Organization[]> {
        const pool = await this.getConnection();
        try {
            const searchTerm = `%${query}%`;
            const [rows] = await pool.query<RowDataPacket[]>(
                `SELECT 
                    id,
                    tenant_name,
                    tenant_slug,
                    db_name,
                    tenant_code,
                    email,
                    phone,
                    location,
                    country,
                    logo_url,
                    status,
                    deployment_type,
                    created_at,
                    updated_at
                FROM tenant_tracking.tenants 
                WHERE status != 'deleted' 
                AND (tenant_name LIKE ? OR email LIKE ?)
                ORDER BY created_at DESC 
                LIMIT ?`,
                [searchTerm, searchTerm, limit]
            );
            
            return rows.map((row: any) => this.mapToOrganization(row));
        } catch (error) {
            console.error('Error in search:', error);
            return [];
        }
    }

    /**
     * Get active organizations only
     */
    async findActive(limit: number = 100, offset: number = 0): Promise<Organization[]> {
        const pool = await this.getConnection();
        try {
            const [rows] = await pool.query<RowDataPacket[]>(
                `SELECT 
                    id,
                    tenant_name,
                    tenant_slug,
                    db_name,
                    tenant_code,
                    email,
                    phone,
                    location,
                    country,
                    logo_url,
                    status,
                    deployment_type,
                    created_at,
                    updated_at
                FROM tenant_tracking.tenants 
                WHERE status = 'active'
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?`,
                [limit, offset]
            );
            
            return rows.map((row: any) => this.mapToOrganization(row));
        } catch (error) {
            console.error('Error in findActive:', error);
            return [];
        }
    }

    /**
     * Activate an organization
     */
    async activate(id: string): Promise<boolean> {
        const pool = await this.getConnection();
        try {
            const [result] = await pool.query<mysql.ResultSetHeader>(
                `UPDATE tenant_tracking.tenants SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in activate:', error);
            return false;
        }
    }

    /**
     * Suspend an organization
     */
    async suspend(id: string): Promise<boolean> {
        const pool = await this.getConnection();
        try {
            const [result] = await pool.query<mysql.ResultSetHeader>(
                `UPDATE tenant_tracking.tenants SET status = 'suspended', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in suspend:', error);
            return false;
        }
    }
}

export default OrganizationModel;