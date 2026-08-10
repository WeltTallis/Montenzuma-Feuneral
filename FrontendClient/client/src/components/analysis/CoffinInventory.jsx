import React, { useState } from 'react';

const Ic = ({ children, size = 15, color = "currentColor", sw = 2.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw}
    style={{ display: 'inline-flex', flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
    {children}
  </svg>
);

const COFFINS = [
  { name: 'Mahogany Premium', branch: 'Nairobi HQ', price: 'KES 45,000', stock: 12, booked: 3, status: 'available' },
  { name: 'Oak Standard', branch: 'Mombasa', price: 'KES 28,000', stock: 8, booked: 5, status: 'low' },
  { name: 'Pine Economy', branch: 'Kisumu', price: 'KES 12,000', stock: 3, booked: 2, status: 'critical' },
  { name: 'Hardwood Deluxe', branch: 'Nairobi HQ', price: 'KES 62,000', stock: 15, booked: 1, status: 'available' },
  { name: 'Wicker Natural', branch: 'Nakuru', price: 'KES 9,500', stock: 0, booked: 0, status: 'out' },
];

const STATUS_CFG = {
  available: { label: 'Available', color: 'var(--color-green)', bg: 'var(--color-green-light)' },
  low: { label: 'Low Stock', color: 'var(--color-amber)', bg: 'var(--color-amber-light)' },
  critical: { label: 'Critical', color: 'var(--color-red)', bg: 'var(--color-red-light)' },
  out: { label: 'Out of Stock', color: 'var(--color-muted-foreground)', bg: 'var(--color-muted)' },
};

function DoughnutChart() {
  const totalStock = COFFINS.reduce((sum, c) => sum + c.stock, 0);
  const totalBooked = COFFINS.reduce((sum, c) => sum + c.booked, 0);
  const totalCapacity = totalStock + totalBooked;
  
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const stockPercentage = totalCapacity > 0 ? (totalStock / totalCapacity) * 100 : 0;
  const bookedPercentage = totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0;
  
  const stockOffset = circumference - (stockPercentage / 100) * circumference;
  const bookedOffset = stockOffset - (bookedPercentage / 100) * circumference;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      {/* Doughnut Chart */}
      <div style={{ position: 'relative', width: 180, height: 180 }}>
        <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth="20"
          />
          {/* Booked segment (orange) */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="var(--color-orange)"
            strokeWidth="20"
            strokeDasharray={circumference}
            strokeDashoffset={bookedOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset .6s ease' }}
          />
          {/* Stock segment (green) */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="var(--color-green)"
            strokeWidth="20"
            strokeDasharray={circumference}
            strokeDashoffset={stockOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset .6s ease' }}
          />
        </svg>
        
        {/* Center content */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-foreground)', lineHeight: 1 }}>
            {totalStock}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted-foreground)', fontWeight: 500, marginTop: 4 }}>
            In Stock
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--color-green)' }} />
          <span style={{ fontSize: 11, color: 'var(--color-foreground)', fontWeight: 500 }}>Available ({totalStock})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--color-orange)' }} />
          <span style={{ fontSize: 11, color: 'var(--color-foreground)', fontWeight: 500 }}>Booked ({totalBooked})</span>
        </div>
      </div>
    </div>
  );
}

export default function CoffinInventory() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)' }}>Coffin Inventory</span>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)', background: 'var(--color-surface)',
          fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          color: 'var(--color-foreground)', transition: 'background .15s, border-color .15s'
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-background)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-foreground)'; }}
        >
          <Ic size={12} color="inherit" sw={2.5}>
            <path d="M12 20h9m-9-4h9m-9-4h9M3 4h18" />
            <path d="M8 4v16m-4 0h16" />
          </Ic>
          Manage
        </button>
      </div>

      {/* Single Doughnut Chart Card */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 8, textAlign: 'center' }}>
          Stock Overview
        </div>
        <DoughnutChart />
      </div>
    </div>
  );
}
