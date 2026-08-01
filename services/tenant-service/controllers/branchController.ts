import * as mysql from 'mysql2/promise';
import { TenantModel } from '../models/Tenant.model';
import { Request, Response } from 'express';
import logger from '@montezuma/shared-logger';

/**
 * Safely extract a string header value from the request headers.
 * Express headers can be `string | string[] | undefined`.
 */
function getHeader(req: Request, name: string): string {
  const value = req.headers[name];
  if (Array.isArray(value)) {
    return value[0] || '';
  }
  return value || '';
}

/**
 * BranchController: Handles branch CRUD with per-branch database architecture.
 * Each branch gets its OWN database.
 * 
 * Also manages branch-to-branch connections so branches can communicate
 * (e.g., request coffin inventory from a partner branch).
 */
export class BranchController {
  /**
   * GET /branches — List all branches for a tenant (with their db names)
   */
  async listBranches(req: Request, res: Response): Promise<void> {
    try {
      const tenantSlug = req.headers['x-tenant-slug'] as string || req.query.slug as string;
      if (!tenantSlug) {
        res.status(400).json({ success: false, message: 'Tenant slug required' });
        return;
      }

      const tenant = await TenantModel.findBySubdomain(tenantSlug);
      if (!tenant) {
        res.status(404).json({ success: false, message: 'Tenant not found' });
        return;
      }

      const branches = await TenantModel.getBranches(tenant.db_name);
      res.json({ success: true, data: { branches } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /branches — Create a new branch (creates a dedicated database)
   * After creating, auto-connects the new branch to all existing branches.
   */
  async createBranch(req: Request, res: Response): Promise<void> {
    try {
      const tenantSlug = req.headers['x-tenant-slug'] as string;
      if (!tenantSlug) {
        res.status(400).json({ success: false, message: 'Tenant slug required' });
        return;
      }

      const tenant = await TenantModel.findBySubdomain(tenantSlug);
      if (!tenant) {
        res.status(404).json({ success: false, message: 'Tenant not found' });
        return;
      }

      const { branch_name, branch_location, branch_phone, branch_email } = req.body;
      if (!branch_name) {
        res.status(400).json({ success: false, message: 'Branch name required' });
        return;
      }

      const result = await TenantModel.addBranch(tenant.db_name, {
        branch_name,
        branch_location: branch_location || '',
        branch_phone: branch_phone || '',
        branch_email: branch_email || ''
      });

      // Auto-connect the new branch to all existing branches
      try {
        await TenantModel.autoConnectBranches(tenant.db_name, tenantSlug);
        logger.info({ service: 'tenant-service', function: 'createBranch', message: 'Auto-connected new branch to existing branches' });
      } catch (connectErr: any) {
        logger.warn({ service: 'tenant-service', function: 'createBranch', message: 'Auto-connect failed', error: connectErr.message });
      }

      res.status(201).json({
        success: true,
        data: {
          branch_id: result.branch_id,
          branch_db_name: result.branch_db_name,
          message: `Branch "${branch_name}" created with its own database: ${result.branch_db_name}`
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ─── Branch Connection Endpoints ────────────────────────────────────

  /**
   * GET /branches/connections — List all branch connections for the tenant
   */
  async listConnections(req: Request, res: Response): Promise<void> {
    try {
      const tenantSlug = getHeader(req, 'x-tenant-slug');
      if (!tenantSlug) {
        res.status(400).json({ success: false, message: 'Tenant slug required' });
        return;
      }

      const tenant = await TenantModel.findBySubdomain(tenantSlug);
      if (!tenant) {
        res.status(404).json({ success: false, message: 'Tenant not found' });
        return;
      }

      const connections = await TenantModel.getAllBranchConnections(tenant.db_name);
      res.json({ success: true, data: { connections } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /branches/:branchId/connections — List connections for a specific branch
   */
  async listBranchConnections(req: Request, res: Response): Promise<void> {
    try {
      const tenantSlug = getHeader(req, 'x-tenant-slug');
      const branchId = parseInt(req.params.branchId);

      if (!tenantSlug) {
        res.status(400).json({ success: false, message: 'Tenant slug required' });
        return;
      }
      if (!branchId) {
        res.status(400).json({ success: false, message: 'Valid branch ID required' });
        return;
      }

      const tenant = await TenantModel.findBySubdomain(tenantSlug);
      if (!tenant) {
        res.status(404).json({ success: false, message: 'Tenant not found' });
        return;
      }

      const connections = await TenantModel.getBranchConnections(tenant.db_name, branchId);
      res.json({ success: true, data: { connections } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /branches/connections — Create a connection between two branches
   * Body: { branch_id, connected_branch_id, connection_type?, notes? }
   */
  async createConnection(req: Request, res: Response): Promise<void> {
    try {
      const tenantSlug = getHeader(req, 'x-tenant-slug');
      if (!tenantSlug) {
        res.status(400).json({ success: false, message: 'Tenant slug required' });
        return;
      }

      const tenant = await TenantModel.findBySubdomain(tenantSlug);
      if (!tenant) {
        res.status(404).json({ success: false, message: 'Tenant not found' });
        return;
      }

      const { branch_id, connected_branch_id, connection_type, notes } = req.body;
      if (!branch_id || !connected_branch_id) {
        res.status(400).json({ success: false, message: 'branch_id and connected_branch_id are required' });
        return;
      }

      const connectionId = await TenantModel.createBranchConnection(
        tenant.db_name,
        tenantSlug,
        parseInt(branch_id),
        parseInt(connected_branch_id),
        connection_type || 'partnership',
        notes
      );

      res.status(201).json({
        success: true,
        data: {
          connection_id: connectionId,
          message: 'Branch connection created successfully. Branches can now communicate.'
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * PUT /branches/connections/:connectionId — Update a connection status
   * Body: { status }
   */
  async updateConnection(req: Request, res: Response): Promise<void> {
    try {
      const tenantSlug = getHeader(req, 'x-tenant-slug');
      const connectionId = parseInt(req.params.connectionId);

      if (!tenantSlug) {
        res.status(400).json({ success: false, message: 'Tenant slug required' });
        return;
      }

      const tenant = await TenantModel.findBySubdomain(tenantSlug);
      if (!tenant) {
        res.status(404).json({ success: false, message: 'Tenant not found' });
        return;
      }

      const { status } = req.body;
      if (!['active', 'inactive', 'pending'].includes(status)) {
        res.status(400).json({ success: false, message: 'Valid status required (active, inactive, pending)' });
        return;
      }

      await TenantModel.updateBranchConnection(tenant.db_name, connectionId, status);
      res.json({ success: true, message: 'Connection updated successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * DELETE /branches/connections/:connectionId — Delete a connection
   */
  async deleteConnection(req: Request, res: Response): Promise<void> {
    try {
      const tenantSlug = getHeader(req, 'x-tenant-slug');
      const connectionId = parseInt(req.params.connectionId);

      if (!tenantSlug) {
        res.status(400).json({ success: false, message: 'Tenant slug required' });
        return;
      }

      const tenant = await TenantModel.findBySubdomain(tenantSlug);
      if (!tenant) {
        res.status(404).json({ success: false, message: 'Tenant not found' });
        return;
      }

      await TenantModel.deleteBranchConnection(tenant.db_name, connectionId);
      res.json({ success: true, message: 'Connection deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /branches/auto-connect — Auto-connect all branches to each other
   */
  async autoConnect(req: Request, res: Response): Promise<void> {
    try {
      const tenantSlug = getHeader(req, 'x-tenant-slug');
      if (!tenantSlug) {
        res.status(400).json({ success: false, message: 'Tenant slug required' });
        return;
      }

      const tenant = await TenantModel.findBySubdomain(tenantSlug);
      if (!tenant) {
        res.status(404).json({ success: false, message: 'Tenant not found' });
        return;
      }

      await TenantModel.autoConnectBranches(tenant.db_name, tenantSlug);
      res.json({ success: true, message: 'All branches auto-connected successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /branches/:branchId/connections/check/:connectedBranchId
   * Check if two branches can communicate
   */
  async checkConnection(req: Request, res: Response): Promise<void> {
    try {
      const tenantSlug = getHeader(req, 'x-tenant-slug');
      const branchId = parseInt(req.params.branchId);
      const connectedBranchId = parseInt(req.params.connectedBranchId);

      if (!tenantSlug) {
        res.status(400).json({ success: false, message: 'Tenant slug required' });
        return;
      }

      const tenant = await TenantModel.findBySubdomain(tenantSlug);
      if (!tenant) {
        res.status(404).json({ success: false, message: 'Tenant not found' });
        return;
      }

      const canCommunicate = await TenantModel.canBranchesCommunicate(
        tenant.db_name, branchId, connectedBranchId
      );
      res.json({ success: true, data: { canCommunicate } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}