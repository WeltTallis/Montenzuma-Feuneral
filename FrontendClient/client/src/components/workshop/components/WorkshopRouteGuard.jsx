import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { canAccessWorkshop } from '../../../utils/workshopRole';
import { hasSession } from '../../../utils/globalAuth';

const WorkshopRouteGuard = ({ children }) => {
  const { slug } = useParams();

  if (!hasSession()) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessWorkshop()) {
    return <Navigate to={slug ? `/${slug}/dashboard` : '/dashboard'} replace />;
  }

  return children;
};

export default WorkshopRouteGuard;
