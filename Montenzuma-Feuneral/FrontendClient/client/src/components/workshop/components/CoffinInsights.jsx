import React from 'react';
import CoffinCommandCenter from '../../../dashboard/CoffinCommandCenter';

/**
 * CoffinInsights - Workshop Coffin Analytics Dashboard
 * Replaced the old basic insights with the new full real-time CoffinBook Analytics dashboard.
 */
const CoffinInsights = (props) => {
  return (
    <div style={{ width: '100%', marginBottom: 24, borderRadius: 16, overflow: 'hidden' }}>
      <CoffinCommandCenter {...props} embedded={false} />
    </div>
  );
};

export default CoffinInsights;
