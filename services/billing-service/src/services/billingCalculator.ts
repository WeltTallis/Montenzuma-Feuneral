import mysql from 'mysql2/promise';
import { DeceasedCharge, BillingResult } from '../models/Billing';

export class BillingCalculator {
  private logger: any;
  private dbConfig: any;

  constructor(logger: any) {
    this.logger = logger;
    this.dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'tenant_tracking'
    };
  }

  async getActiveDeceased(tenantSlug: string): Promise<any[]> {
    const connection = await mysql.createConnection(this.dbConfig);
    try {
      const [rows] = await connection.execute(`
        SELECT id, deceased_id, full_name, date_admitted, status, tenant_slug
        FROM deceased
        WHERE tenant_slug = ? AND status IN ('admitted', 'active')
      `, [tenantSlug]);
      return rows as any[];
    } finally {
      await connection.end();
    }
  }

  async calculateAndSaveCharges(deceasedId: number, tenantSlug: string): Promise<void> {
    const charges = await this.calculateDeceasedCharges(deceasedId, tenantSlug);
    
    const connection = await mysql.createConnection(this.dbConfig);
    try {
      await connection.beginTransaction();

      // Save to daily_billing table
      await connection.execute(`
        INSERT INTO daily_billing
          (deceased_id, tenant_slug, days_admitted, daily_rate, base_charges, additional_charges, total_charge, billing_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), NOW())
        ON DUPLICATE KEY UPDATE
          days_admitted = VALUES(days_admitted),
          base_charges = VALUES(base_charges),
          additional_charges = VALUES(additional_charges),
          total_charge = VALUES(total_charge),
          updated_at = NOW()
      `, [
        charges.deceasedId,
        tenantSlug,
        charges.daysAdmitted,
        charges.dailyRate,
        charges.baseCharges,
        charges.embalmingCharges + charges.storageCharges,
        charges.totalDailyCharge
      ]);

      // Update deceased total_mortuary_charge
      await connection.execute(`
        UPDATE deceased
        SET total_mortuary_charge = total_mortuary_charge + ?
        WHERE id = ?
      `, [charges.totalDailyCharge, deceasedId]);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.end();
    }
  }

  async calculateDeceasedCharges(deceasedId: number, tenantSlug: string): Promise<DeceasedCharge> {
    const connection = await mysql.createConnection(this.dbConfig);
    try {
      // Get deceased details with charge settings.
      // `dispatch_date` is stamped at handover by the release sync, so days are
      // counted admission → RELEASE: a body already handed back to its family
      // stops accruing instead of being billed for every day since.
      const [deceasedRows] = await connection.execute(`
        SELECT
          date_admitted,
          dispatch_date,
          full_name,
          per_hour_charge,
          per_day_charge,
          charge_currency,
          storage_type
        FROM deceased
        WHERE id = ? AND tenant_slug = ?
      `, [deceasedId, tenantSlug]);

      if (!Array.isArray(deceasedRows) || deceasedRows.length === 0) {
        throw new Error(`Deceased not found: ${deceasedId}`);
      }

      const deceased = (deceasedRows as any[])[0];
      const endOfStay = deceased.dispatch_date ? new Date(deceased.dispatch_date) : new Date();
      const daysAdmitted = Math.max(
        0,
        Math.ceil((endOfStay.getTime() - new Date(deceased.date_admitted).getTime()) / (1000 * 60 * 60 * 24))
      );

      // Priority: 1. Per-deceased charges, 2. Tenant settings, 3. Defaults
      let dailyRate = 1500; // Default daily rate
      let embalmingRate = 3000; // Default embalming rate
      let storageRate = 500; // Default storage rate per day
      let taxRate = 0; // Default tax rate

      // Check if deceased has custom charges set (individual billing)
      const hasCustomCharges = deceased.per_day_charge && deceased.per_day_charge > 0;
      
      if (hasCustomCharges) {
        // Use per-deceased custom rates
        dailyRate = deceased.per_day_charge;
        embalmingRate = deceased.embalming_rate || embalmingRate;
        storageRate = deceased.storage_rate || storageRate;
        taxRate = deceased.tax_rate || taxRate;
        this.logger.info(`Using per-deceased rates for ${deceased.full_name}: daily=${dailyRate}, embalming=${embalmingRate}, storage=${storageRate}`);
      } else {
        // Fall back to tenant settings (default rates for all clients)
        const [settingsRows] = await connection.execute(`
          SELECT daily_rate, embalming_rate, storage_rate, tax_rate
          FROM tenant_settings
          WHERE tenant_slug = ?
        `, [tenantSlug]);

        if (Array.isArray(settingsRows) && settingsRows.length > 0) {
          const settings = (settingsRows as any[])[0];
          dailyRate = settings.daily_rate || dailyRate;
          embalmingRate = settings.embalming_rate || embalmingRate;
          storageRate = settings.storage_rate || storageRate;
          taxRate = settings.tax_rate || taxRate;
        }
      }

      // Calculate charges
      const baseCharges = daysAdmitted * dailyRate;
      const embalmingCharges = embalmingRate; // One-time embalming fee
      const storageCharges = daysAdmitted * storageRate; // Storage per day
      const subtotal = baseCharges + embalmingCharges + storageCharges;
      const taxAmount = subtotal * (taxRate / 100);
      const totalDailyCharge = subtotal + taxAmount;

      return {
        deceasedId,
        tenantSlug,
        daysAdmitted,
        dailyRate,
        embalmingRate,
        storageRate,
        taxRate,
        baseCharges,
        embalmingCharges,
        storageCharges,
        taxAmount,
        subtotal,
        totalDailyCharge,
        calculatedAt: new Date().toISOString()
      };
    } finally {
      await connection.end();
    }
  }

  async needsHourlyUpdate(deceasedId: number): Promise<boolean> {
    // For now, always return true - can be optimized later with last_calculated timestamp
    return true;
  }

  async getBillingHistory(tenantSlug: string, startDate?: string, endDate?: string, limit: number = 100): Promise<any> {
    const connection = await mysql.createConnection(this.dbConfig);
    try {
      let query = `
        SELECT * FROM daily_billing
        WHERE tenant_slug = ?
      `;
      const params: any[] = [tenantSlug];

      if (startDate) {
        query += ' AND billing_date >= ?';
        params.push(startDate);
      }

      if (endDate) {
        query += ' AND billing_date <= ?';
        params.push(endDate);
      }

      query += ' ORDER BY billing_date DESC LIMIT ?';
      params.push(limit);

      const [rows] = await connection.execute(query, params);
      return rows;
    } finally {
      await connection.end();
    }
  }
}
