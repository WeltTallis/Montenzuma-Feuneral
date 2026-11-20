const STATUS_CONFIG = {
    'under care': { label: 'In Care', c: C.cBlue, filter: 'under care' },
    admitted: { label: 'In Care', c: C.cBlue, filter: 'admitted' },
    postmortem: { label: 'PM Requested', c: C.cOrange, filter: 'under care' },
    pending: { label: 'Scheduled', c: C.gray, filter: 'under care' },
    released: { label: 'Released', c: C.success, filter: 'released' },
    completed: { label: 'PM Done', c: C.cPurple, filter: 'completed' },
    cancelled: { label: 'Cancelled', c: C.gray, filter: 'other' },
    maintenance: { label: 'Maintenance', c: C.gray, filter: 'other' },
    default: { label: 'In Care', c: C.cBlue, filter: 'under care' },
};
