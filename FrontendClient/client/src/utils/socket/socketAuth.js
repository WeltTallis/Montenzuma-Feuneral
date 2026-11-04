// src/utils/socket/socketAuth.js
// Shared Socket.IO handshake-authentication helpers.
//
// Browser sockets authenticate through the HttpOnly access cookie; tokens
// must not be copied into Socket.IO's JavaScript-readable auth payload.

import { getTenantSlug } from '../globalAuth';

/**
 * The cookie is intentionally inaccessible to JavaScript.
 */
export const getSocketToken = () => {
  return '';
};

/**
 * Build the non-secret metadata payload; authentication uses the cookie.
 */
export const getSocketAuth = (extra = {}) => {
  const safeExtra = { ...extra };
  delete safeExtra.token;
  let userId;
  try {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    userId = user.user_id || user.userId || user.id || user._id || undefined;
  } catch {
    userId = undefined;
  }

  return {
    tenantSlug: getTenantSlug() || undefined,
    userId,
    ...safeExtra,
  };
};

/**
 * Refresh metadata before reconnection; browser cookies are sent automatically.
 */
export const refreshSocketAuth = (socket, extra = {}) => {
  if (!socket) return;
  socket.auth = { ...(socket.auth || {}), ...getSocketAuth(extra) };
};
