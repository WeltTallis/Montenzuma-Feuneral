const getTenantSlug = () => {
    const direct = localStorage.getItem('tenantSlug') || localStorage.getItem('tenant_slug');
    if (direct && direct !== 'default' && direct !== 'dashboard' && direct !== 'undefined' && direct !== 'null') return direct;
    const parent = localStorage.getItem('parentTenantSlug');
    if (parent && parent !== 'default' && parent !== 'dashboard' && parent !== 'undefined' && parent !== 'null') return parent;
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.parentTenantSlug || user.tenantSlug || user.tenant?.slug || '';
    } catch { return ''; }
};







module.exports = getTenantSlug;