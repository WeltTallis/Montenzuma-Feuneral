// WorkshopRouteGuard.jsx
// Role guard for workshop paths.
// Allowed roles: workshop, carpenter, workshop_technician, workshop_manager
//                (plus admin/manager/systemadmin/system_administrator/tenant_admin).
// Anyone else is bounced back to the deceased list.
// Usage (in AppRouter.jsx):
//   <Route path="workshop" element={
//     <WorkshopRouteGuard>
//       <Layout ...><WorkshopDashboard /></Layout>
//     </WorkshopRouteGuard>
//   } />
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { canAccessWorkshop } from '../../../utils/workshopRole';

const WorkshopRouteGuard = ({ children }) => {
  const location = useLocation();
  const allowed = canAccessWorkshop();

  // No session / not a workshop role → send to the deceased list (or login if no session at all).
  if (!allowed) {
    const hasToken =
      localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!hasToken) return <Navigate to="/login" replace />;
    return <Navigate to="/deceased" replace />;
  }

  return children;
};

export default WorkshopRouteGuard;
