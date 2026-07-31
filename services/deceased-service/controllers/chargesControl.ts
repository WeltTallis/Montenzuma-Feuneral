import { Request, Response } from 'express';
import { query, execute, resolveDatabase, safeTenantExecute, safeTenantQuery } from '../../../shared/dbConfig';


// Mock data for development - will be replaced with actual DB queries
let mockCharges: any[] = [];
let mockPayments: any[] = [];

/**     
 * GET /charges/:deceased_id
 * Get all charges for a deceased
 */    


export const getCharges = async (req: Request, res: Response) => {
  try {
    const { deceased_id } = req.params;
    const tenantSlug = (req as any).headers['x-slug'] || (req as any).headers['x-tenant-slug'] || 'system_shared';
    
    // Filter charges for this deceased
    const charges = mockCharges.filter(c => c.deceased_id === deceased_id);
    
    return res.json({
      success: true,
      data: charges,
      message: 'Charges retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error getting charges:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve charges'
    });
  }
};

/**
 * POST /charges
 * Add a new charge
 */

export const addCharge = async (req: Request, res: Response) => {
  try {
    const chargeData = req.body;
    const newCharge = {
      id: Date.now().toString(),
      ...chargeData,
      created_at: new Date().toISOString()
    };
    mockCharges.push(newCharge);
    
    return res.status(201).json({
      success: true,
      data: newCharge,
      message: 'Charge added successfully'
    });
  } catch (error: any) {
    console.error('Error adding charge:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to add charge'
    });
  }
};

/**
 * PUT /charges/:id
 * Update an existing charge
 */
export const updateCharge = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const index = mockCharges.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Charge not found'
      });
    }
    
    mockCharges[index] = {
      ...mockCharges[index],
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    return res.json({
      success: true,
      data: mockCharges[index],
      message: 'Charge updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating charge:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update charge'
    });
  }
}; 







/**
 * DELETE /charges/:id
 * Delete a charge
 */
export const deleteCharge = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const index = mockCharges.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Charge not found'
      });
    }
    
    mockCharges.splice(index, 1);
    
    return res.json({
      success: true,
      message: 'Charge deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting charge:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete charge'
    });
  }
};

/**
 * GET /payments/:deceased_id
 * Get all payments for a deceased
 */
export const getPayments = async (req: Request, res: Response) => {
  try {
    const { deceased_id } = req.params;
    const tenantSlug = (req as any).headers['x-slug'] || (req as any).headers['x-tenant-slug'] || 'system_shared';
    
    // Filter payments for this deceased
    const payments = mockPayments.filter(p => p.deceased_id === deceased_id);
    
    return res.json({
      success: true,
      data: payments,
      message: 'Payments retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error getting payments:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve payments'
    });
  }
};

/**
 * POST /payments
 * Record a new payment
 */
export const recordPayment = async (req: Request, res: Response) => {
  try {
    const tenantSlug = (req as any).headers['x-slug'] || (req as any).headers['x-tenant-slug'] || 'system_shared';
    const paymentData = req.body;
    
    // Validate required fields
    if (!paymentData.deceased_id || !paymentData.amount || !paymentData.payment_method) {
      return res.status(400).json({
        success: false,
        message: 'deceased_id, amount, and payment_method are required'
      });
    }
    
    const newPayment = {
      id: Date.now().toString(),
      ...paymentData,
      recorded_by: paymentData.recorded_by || (req as any).user?.name || (req as any).user?.username || 'System',
      payment_date: paymentData.payment_date || new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    mockPayments.push(newPayment);
    
    // ==============================
    // EMIT PAYMENT NOTIFICATION
    // ==============================
    try {
      const axios = require('axios');
      // Try multiple socketio service URLs (Docker DNS, localhost fallback)
      const configuredUrl = process.env.SOCKETIO_SERVICE_URL || '';
      const candidateUrls = [
        configuredUrl,
        'http://localhost:5018',
        'http://127.0.0.1:5018',
      ].filter(Boolean);

      const emitPayload = {
        tenantSlug,
        data: {
          id: `payment-${newPayment.id}-${Date.now()}`,
          deceasedId: paymentData.deceased_id,
          amount: paymentData.amount,
          paymentMethod: paymentData.payment_method,
          title: 'Payment Received',
          message: `Payment of ${paymentData.amount} received via ${paymentData.payment_method}`,
          type: 'payment-received',
          priority: 'high',
          fullContent: `Payment recorded for deceased ${paymentData.deceased_id}.\nAmount: ${paymentData.amount}\nMethod: ${paymentData.payment_method}\nDate: ${newPayment.payment_date}`,
        }
      };

      let emitted = false;
      for (const socketioServiceUrl of candidateUrls) {
        try {
          await axios.post(`${socketioServiceUrl}/emit/payment-received`, emitPayload, { timeout: 3000 });
          emitted = true;
          console.log(`[PAYMENT] Emitted payment-received notification via ${socketioServiceUrl}`);
          break;
        } catch (urlError: any) {
          console.warn(`[PAYMENT] SocketIO URL failed: ${socketioServiceUrl} - ${urlError.message}`);
        }
      }

      if (!emitted) {
        console.warn('[PAYMENT] All socketio URLs failed to emit payment notification');
      }
    } catch (emitError: any) {
      console.warn('[PAYMENT] Failed to emit payment notification:', emitError.message);
    }
    
    return res.status(201).json({
      success: true,
      data: newPayment,
      message: 'Payment recorded successfully'
    });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to record payment'
    });
  }
};
