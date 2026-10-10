
const env = {
  // API Gateway URL - all requests go through the gateway
  API_URL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://restpoint.co.ke/api/v1/restpoint' : 'http://localhost:5000'),

  // API Gateway base path for all microservices
  API_GATEWAY_URL: import.meta.env.VITE_API_GATEWAY_URL || (import.meta.env.PROD ? 'https://restpoint.co.ke' : 'http://localhost:5000'),

  // Base path for all RestPoint API endpoints
  API_BASE_PATH: import.meta.env.PROD ? '/api/v1/restpoint' : '/api/v1/restpoint',

  // Full API base URL (gateway + base path)
  get FULL_API_URL() {
    if (import.meta.env.PROD) {
      return 'https://restpoint.co.ke/api/v1/restpoint';
    }
    return `${this.API_GATEWAY_URL}${this.API_BASE_PATH}`;
  },

  // Timeout for API requests in milliseconds
  API_TIMEOUT: 30000,

  // Hearse service API URL (direct access for driver portal)
  HEARSE_API_URL: import.meta.env.VITE_HEARSE_API_URL || (import.meta.env.PROD ? 'https://restpoint.co.ke/api/v1/restpoint/hearse' : 'http://localhost:5002'),

  // Workshop service API URL (goes through API gateway for auth forwarding)
  WORKSHOP_API_URL: import.meta.env.VITE_WORKSHOP_API_URL || (import.meta.env.PROD ? 'https://restpoint.co.ke/api/v1/restpoint' : 'http://localhost:5000/api/v1/restpoint'),

  // WebSocket URL for real-time features
  // Development: connects directly to socketio-service on port 5018
  // Production: wss://restpoint.co.ke — nginx proxies /socket.io/
  SOCKET_URL: import.meta.env.VITE_WS_URL || 
               import.meta.env.VITE_SOCKET_URL || 
               import.meta.env.VITE_SOCKETIO_URL || 
               (import.meta.env.PROD ? 'wss://restpoint.co.ke' : 'ws://localhost:5018'),

  // Socket.IO path - REQUIRED for production
  // This tells the client to connect to /socket.io/ endpoint
  SOCKET_PATH: import.meta.env.VITE_SOCKET_PATH || '/socket.io/',

  // Centralized uploads folder - served by the API gateway (same origin)
  UPLOADS_URL: import.meta.env.VITE_UPLOADS_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000'),

  // Mini Store service - inventory + pick/restock
  STORE_SERVICE_API: import.meta.env.VITE_STORE_SERVICE_API ||
    (import.meta.env.PROD
      ? '/api/v1/restpoint/store'
      : 'http://localhost:5000/api/v1/restpoint/store'),

  // Feature flags
  FEATURES: {
    ENABLE_ANALYTICS: true,
  }
};

export default env;
