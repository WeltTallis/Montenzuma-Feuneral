import { RowDataPacket } from 'mysql2';

/**
 * Mini Store Service - data models
 * A lightweight store inventory: items + stock transactions.
 */

export type ItemAction = 'used' | 'restocked' | 'adjusted';

export interface StoreItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface StoreItemRecord extends RowDataPacket {
  id: number;
  name: string;
  category: string;
  unit: string;
  stock: number;
  min_stock: number;
  created_at: Date;
  updated_at: Date;
}

export interface StoreTransactionRecord extends RowDataPacket {
  id: number;
  item_id: number;
  item_name: string;
  action: ItemAction;
  quantity: number;
  unit: string;
  staff: string;
  reason: string;
  remaining: number;
  created_at: Date;
}

export interface CreateItemDTO {
  name: string;
  category?: string;
  unit?: string;
  stock?: number;
  minStock?: number;
}

export interface MovementDTO {
  quantity: number;
  staff?: string;
  reason?: string;
  notes?: string;
}

export interface AdjustDTO {
  newStock: number;
  staff?: string;
  reason?: string;
}

export interface StatsResult {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  usedToday: number;
}