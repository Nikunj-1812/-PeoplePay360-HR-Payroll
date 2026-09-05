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
    const rawApiUrl = import.meta.env.VITE_API_URL || '';
    const socketUrl = rawApiUrl 
      ? rawApiUrl.replace(/\/api\/?$/, '') 
      : (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1'))
        ? 'http://localhost:5000' 
        : window.location.origin;

    socket = io(socketUrl, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to backend real-time server with socket ID:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO] Connection error (falling back seamlessly to HTTP API):', err.message);
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
