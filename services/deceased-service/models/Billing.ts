import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { tenantDB } from '../config/tenantDatabase';
import { Logger } from '../../app-global/middlewares/serviceDiscovery';

export interface BillingRecord {
  id: number;
  billing_id: string;
  deceased_id: string;
  tenant_slug: string;
  billing_date: Date;
  amount: number;
  currency: string;
  charge_type: 'daily' | 'hourly';
  rate_used: number;
  status: 'pending' | 'due' | 'overdue' | 'paid' | 'partial';
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
}

export interface CreateBillingDTO {
  deceased_id: string;
  billing_date: Date;
  amount: number;
  currency: string;
  charge_type: 'daily' | 'hourly';
  rate_used: number;
  notes?: string;
}

export class BillingModel {
  /**
   * Create billing record
   */
  static async create(tenantSlug: string, data: CreateBillingDTO): Promise<BillingRecord | null> {
    const conn = await tenantDB.getConnection(tenantSlug);

    try {
      const billingDate = new Date(data.billing_date).toISOString().split('T')[0];
      const billing_id = `BILL-${tenantSlug.toUpperCase()}-${data.deceased_id}-${billingDate}`;

      const result = await conn.execute(
        `INSERT INTO billing (
          billing_id, deceased_id, tenant_slug, billing_date, amount, currency,
          charge_type, rate_used, status, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
        [
          billing_id,
          data.deceased_id,
          tenantSlug,
          billingDate,
          data.amount,
          data.currency,
          data.charge_type,
          data.rate_used,
          data.notes || null,
        ]
      );

      return this.getByBillingId(tenantSlug, billing_id);
    } catch (error) {


      Logger.error({
        message: "  Error   creating  billing records for   daily   deceased ",
        error: error
      })

      return null;
    } finally {
      conn.release();
    }
  }

  /**
   * Get billing by billing_id
   */
  static async getByBillingId(tenantSlug: string, billingId: string): Promise<BillingRecord | null> {
    const conn = await tenantDB.getConnection(tenantSlug);

    try {
      const result = await conn.execute(
        'SELECT * FROM billing WHERE billing_id = ? AND tenant_slug = ? AND is_deleted = FALSE',
        [billingId, tenantSlug]
      );

      const rows = result[0] as BillingRecord[];
      return rows.length > 0 ? rows[0] : null;
    } finally {
      conn.release();
    }
  }

  /**
   * Get billing for a deceased by date range
   */
  static async getByDeceasedAndDateRange(
    tenantSlug: string,
    deceasedId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BillingRecord[]> {
    const conn = await tenantDB.getConnection(tenantSlug);

    try {
      const result = await conn.execute(
        `SELECT * FROM billing 
         WHERE deceased_id = ? AND tenant_slug = ? AND billing_date BETWEEN ? AND ? AND is_deleted = FALSE
         ORDER BY billing_date DESC`,
        [deceasedId, tenantSlug, startDate, endDate]
      );

      return result[0] as BillingRecord[];
    } finally {
      conn.release();
    }
  }

  /**
   * Get billing summary grouped by date
   */
  static async getBillingSummary(tenantSlug: string, deceasedId: string): Promise<any[]> {
    const conn = await tenantDB.getConnection(tenantSlug);

    try {
      const result = await conn.execute(
        `SELECT 
          DATE_FORMAT(billing_date, '%Y-%m-%d') as date,
          SUM(amount) as total_amount,
          COUNT(*) as count,
          currency,
          status,
          GROUP_CONCAT(rate_used DISTINCT) as rates
         FROM billing
         WHERE deceased_id = ? AND tenant_slug = ? AND is_deleted = FALSE
         GROUP BY billing_date, status, currency
         ORDER BY billing_date DESC`,
        [deceasedId, tenantSlug]
      );

      return result[0] as any[];
    } finally {
      conn.release();
    }
  }

  /**
   * Check if billing exists for date
   */
  static async existsForDate(tenantSlug: string, deceasedId: string, billingDate: Date): Promise<boolean> {
    const conn = await tenantDB.getConnection(tenantSlug);

    try {
      const dateStr = new Date(billingDate).toISOString().split('T')[0];
      const result = await conn.execute(
        `SELECT COUNT(*) as count FROM billing 
         WHERE deceased_id = ? AND tenant_slug = ? AND DATE(billing_date) = ? AND is_deleted = FALSE`,
        [deceasedId, tenantSlug, dateStr]
      );

      const rows = result[0] as any[];
      return rows[0]?.count > 0;
    } finally {
      conn.release();
    }
  }

  /**
   * Generate billing for all active deceased
   */
  static async generateDailyBillingForTenant(tenantSlug: string): Promise<number> {
    const conn = await tenantDB.getConnection(tenantSlug);
    let generatedCount = 0;

    try {
      const [schemaRows] = await conn.execute(
        `SELECT TABLE_NAME, COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME IN ('deceased', 'body_releases')`
      );
      const schemaColumns = new Map<string, Set<string>>();
      for (const row of schemaRows as Array<{ TABLE_NAME: string; COLUMN_NAME: string }>) {
        const columns = schemaColumns.get(row.TABLE_NAME) || new Set<string>();
        columns.add(row.COLUMN_NAME);
        schemaColumns.set(row.TABLE_NAME, columns);
      }

      const deceasedColumns = schemaColumns.get('deceased') || new Set<string>();
      const releaseColumns = schemaColumns.get('body_releases') || new Set<string>();
      const activeConditions = [
        'd.tenant_slug = ?',
        'd.is_deleted = FALSE',
        'd.date_admitted <= DATE_SUB(NOW(), INTERVAL 24 HOUR)',
      ];
      if (deceasedColumns.has('admission_status')) {
        activeConditions.push("LOWER(COALESCE(d.admission_status, '')) NOT IN ('released', 'buried')");
      }
      if (deceasedColumns.has('release_status')) {
        activeConditions.push("LOWER(COALESCE(d.release_status, '')) <> 'released'");
      }
      if (deceasedColumns.has('body_status')) {
        activeConditions.push(
          "LOWER(COALESCE(d.body_status, '')) NOT IN ('released', 'transferred', 'buried', 'dispatched', 'completed', 'collected')"
        );
      }
      if (deceasedColumns.has('admission_number') && releaseColumns.has('admission_number')) {
        activeConditions.push(
          'NOT EXISTS (SELECT 1 FROM body_releases br WHERE br.admission_number = d.admission_number)'
        );
      }

      // Only charge full 24-hour stays, and never charge after a release record exists.
      const deceasedResult = await conn.execute(
        `SELECT d.deceased_id, d.date_admitted
         FROM deceased d
         WHERE ${activeConditions.join(' AND ')}`,
        [tenantSlug]
      );

      const deceasedList = deceasedResult[0] as any[];
      const today = new Date().toISOString().split('T')[0];

      for (const deceased of deceasedList) {
        const { deceased_id } = deceased;

        // Check if billing already exists for today
        const existsToday = await this.existsForDate(tenantSlug, deceased_id, new Date(today));

        if (existsToday) {
          continue;
        }

        // Get charge settings
        const ChargeSettingsModel = require('./ChargeSettings').ChargeSettingsModel;
        const settings = await ChargeSettingsModel.ensureExists(tenantSlug, deceased_id);

        // Create billing record
        const created = await this.create(tenantSlug, {
          deceased_id,
          billing_date: new Date(today),
          amount: settings.daily_rate,
          currency: settings.currency,
          charge_type: 'daily',
          rate_used: settings.daily_rate,
          notes: `Daily charge for ${settings.rate_profile} profile`,
        });

        if (created) {
          generatedCount++;
        }
      }


      Logger.info({
        message: ` Billing  records    genated    for   ${tenantSlug}`
      })


      return generatedCount;
    } catch (error) {



      Logger.error({
        message: "Error   genarting   a   daily   billing for  deceased",
        error: error
      });


      return 0;
    } finally {
      conn.release();
    }
  }
}
