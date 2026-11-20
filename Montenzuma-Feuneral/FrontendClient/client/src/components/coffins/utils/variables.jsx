import env from '../../../utils/config/env';
import S from './colors';

const getCoffinStock = (coffin) =>
    Math.max(0, parseInt(coffin?.stock ?? coffin?.quantity, 10) || 0);

const getCoffinImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== 'string') return null;
    const cleanPath = imagePath.trim();
    if (/^https?:\/\//i.test(cleanPath)) return cleanPath;
    const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${env.API_GATEWAY_URL}${normalizedPath}`;
};



const getBookingStatus = (status) => {
    const map = {
        pending: { label: 'Pending', cls: 'tag-pe' },
        booked: { label: 'Approved', cls: 'tag-bo' },
        completed: { label: 'Completed', cls: 'tag-co' },
        cancelled: { label: 'Cancelled', cls: 'tag-ca' },
        approved: { label: 'Approved', cls: 'tag-ar' },
        rejected: { label: 'Rejected', cls: 'tag-ou' },
        delivered: { label: 'Delivered', cls: 'tag-de' },
    };

    // 2-status flow: legacy "transferring/In Transit" rows render as Approved.
    const normalized = ['transferring', 'transit', 'in-transit', 'in_transit'].includes(status)
        ? 'approved'
        : status;
    return map[normalized] || map.pending;
};



const getReqStatus = (status) => {
    const map = {
        pending: { label: 'Pending', cls: 'tag-pe' },
        approved: { label: 'Approved', cls: 'tag-ar' },
        rejected: { label: 'Rejected', cls: 'tag-ou' },
        delivered: { label: 'Delivered', cls: 'tag-de' },
    };
    const normalized = ['transferring', 'transit', 'in-transit', 'in_transit'].includes(status)
        ? 'approved'
        : status;
    return map[normalized] || map.pending;
};

const getBookingDotColor = (b) => {
    switch (b.status) {
        case 'pending':
            return S.warning;
        case 'booked':
        case 'approved':
            return S.info;
        case 'completed':
            return S.success;
        case 'cancelled':
        case 'rejected':
            return S.danger;
        default:
            return S.primary;
    }
};

const getCoffinName = (coffinId, coffinsList = []) => {
    const c = coffinsList.find((x) => (x.coffin_id || x.id) == coffinId);
    return c ? c.name : 'Coffin';
};

const getStatusColor = (status) => {
    const map = {
        pending: S.warning,
        booked: S.info,
        approved: S.info,
        completed: S.success,
        cancelled: S.danger,
        rejected: S.danger,
        delivered: '#0D9488',
    };
    const normalized = ['transferring', 'transit', 'in-transit', 'in_transit'].includes(status)
        ? 'approved'
        : status;
    return map[normalized] || S.primary;
};

const formatKES = (n) => 'KES ' + parseFloat(n || 0).toLocaleString();

const getCoofinStok = getCoffinStock;
const formatKes = formatKES;


const getStockStatus = (stock) => {
    if (stock <= 0) return { label: 'Out of Stock', cls: 'tag-ou', color: '#dc2626' };
    if (stock <= 2) return { label: 'Low Stock', cls: 'tag-lo', color: '#d97706' };
    return { label: 'Available', cls: 'tag-ok', color: '#059669' };
};



export default {
    getCoofinStok,
    getCoffinImageUrl,
    getBookingStatus,
    getReqStatus,
    getBookingDotColor,
    getCoffinName,
    getStatusColor,
    formatKes,
    getStockStatus
}
