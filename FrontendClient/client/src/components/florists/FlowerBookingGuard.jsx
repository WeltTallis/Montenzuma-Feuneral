// FlowerBookingGuard.jsx
// Role guard for creating flower bookings (/flowers/new).
// All roles (staff + manager + workshop roles + admin) may VIEW flowers,
// but only staff / manager / workshop roles / admin may CREATE a booking.
// Usage (in AppRouter.jsx):
//   <Route path="flowers/new" element={
//     <FlowerBookingGuard><FlowerBookingForm /></FlowerBookingGuard>
//   } />
import React from 'react';
import { Navigate } from 'react-router-dom';
import { canCreateFlowerBooking } from '../../utils/workshopRole';

const FlowerBookingGuard = ({ children }) => {
  const allowed = canCreateFlowerBooking();

  if (!allowed) {
    const hasToken =
      localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!hasToken) return <Navigate to="/login" replace />;
    // Authenticated but not permitted to create a booking — bounce to the
    // read-only flower bookings list.
    return <Navigate to="/flowers" replace />;
  }

  return children;
};

export default FlowerBookingGuard;
