import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { hasSession } from '../../../utils/globalAuth';

const WorkshopRouteGuard = ({ children }) => {
  const { slug } = useParams();

  if (!hasSession()) {
    return <Navigate to="/login" replace />;
  }

  // Every authenticated user can enter the independent workshop dashboard.
  // The previous role gate redirected non-workshop staff (e.g. transport
  // coordinators) to the deceased dashboard, which hid the workshop entirely.
  return children;

};

export default WorkshopRouteGuard;
