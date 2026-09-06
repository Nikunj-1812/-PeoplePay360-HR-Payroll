import { io } from 'socket.io-client';

let socket = null;

/**
 * Get or initialize Socket.IO client instance using JWT authentication token
 */
export function getSocket(token) {
  if (!token) {
    disconnectSocket();
    return null;
  }

  if (!socket) {
    const rawApiUrl = import.meta.env.VITE_DEPLOYED_API_URL || import.meta.env.VITE_API_URL || '';
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    let socketUrl = 'https://peoplepay-360.onrender.com';
    if (isLocalhost) {
      socketUrl = 'http://localhost:5000';
    } else if (rawApiUrl) {
      socketUrl = rawApiUrl.replace(/\/api\/?$/, '');
    }

    socket = io(socketUrl, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
      transports: ['polling', 'websocket']
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to backend real-time server with socket ID:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO] Connection notice (falling back seamlessly to HTTP API):', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
    });
  }

  return socket;
}

/**
 * Update active socket token on re-auth
 */
export function updateSocketToken(token) {
  if (!token) {
    disconnectSocket();
    return;
  }
  if (socket) {
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
  } else {
    getSocket(token);
  }
}

/**
 * Gracefully disconnect socket on logout
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
