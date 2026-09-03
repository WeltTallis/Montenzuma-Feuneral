// src/utils/socket/socketAuth.js
// Shared Socket.IO handshake-authentication helpers.
//
// The socketio-service rejects every connection that has no token in
// `socket.handshake.auth` when running in production (401 "Authentication
// required"). Every socket the client opens MUST therefore attach the current
// access token at handshake time AND re-read it before every reconnection,
// because access tokens rotate every ~10 minutes while a socket instance can
// outlive several of them (and may even be created before login).

import { getTenantSlug } from '../globalAuth';

/**
 * Read the freshest access token available in this tab.
 * sessionStorage wins (tab isolation + it is rotated by the auth refresh
 * loop), localStorage is the cross-refresh fallback. Legacy key names are
 * checked last for backward compatibility.
 */
export const getSocketToken = () => {
  return (
    sessionStorage.getItem('authToken') ||
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('token') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('accessToken') ||
    localStorage.getItem('accessToken') ||
    ''
  );
};

/**
 * Build the `auth` payload required by the socketio-service handshake
 * middleware. `extra` lets callers attach additional fields (e.g. tenantSlug
 * for support tickets) without losing the mandatory token.
 */
export const getSocketAuth = (extra = {}) => {
  let userId;
  try {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    userId = user.user_id || user.userId || user.id || user._id || undefined;
  } catch {
    userId = undefined;
  }

  return {
    token: getSocketToken(),
    tenantSlug: getTenantSlug() || undefined,
    userId,
    ...extra,
  };
};

/**
 * Mutate an existing socket's auth payload in place. Socket.IO re-reads
 * `socket.auth` on every reconnection attempt, so calling this right before a
 * retry (and whenever auth state changes) guarantees the server always
 * receives a fresh, non-empty token instead of the stale mount-time one.
 */
export const refreshSocketAuth = (socket, extra = {}) => {
  if (!socket) return;
  socket.auth = { ...(socket.auth || {}), ...getSocketAuth(extra) };
};
