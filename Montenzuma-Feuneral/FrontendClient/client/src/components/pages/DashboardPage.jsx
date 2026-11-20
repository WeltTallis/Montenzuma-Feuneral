import React from 'react';
import Dashboard from '../../dashboard';

const DashboardPage = ({ tenantSlug, tenantData }) => {
    return <Dashboard tenantSlug={tenantSlug} tenantData={tenantData} />;
};

export default DashboardPage;