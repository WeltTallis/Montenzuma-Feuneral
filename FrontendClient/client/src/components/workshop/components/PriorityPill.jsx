import React from 'react';

/* ============================================================================
   PriorityPill — status/urgency pill.
   ============================================================================ */
const PriorityPill = ({ status, className }) => {
  const config = {
    urgent: { bg: '#fdecee', color: '#d63862', label: 'Urgent' },
    ontrack: { bg: '#eafaf0', color: '#1f9d50', label: 'On Track' },
    cutting: { bg: '#fff4d6', color: '#b07d00', label: 'Cutting' },
    finishing: { bg: '#e9efff', color: '#3a55d6', label: 'Finishing' },
    normal: { bg: '#f4f5f7', color: '#666666', label: 'Normal' },
  };

  const c = config[status] || config.normal;

  return (
    <span className={`ec-status-pill ${className || ''}`} style={{ background: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
};

export default PriorityPill;