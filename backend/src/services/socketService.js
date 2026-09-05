const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

let io = null;

/**
 * Initialize Socket.IO server bound to HTTP server
 */
function initSocket(server, configuredOrigins = []) {
  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        if (isLocalhost || configuredOrigins.includes(origin)) {
          return callback(null, true);
        }
        if (process.env.NODE_ENV !== 'production' || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com') || origin.endsWith('.netlify.app')) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
    },
    pingTimeout: 30000,
    pingInterval: 25000
  });

  // Authenticate socket connection using existing JWT.
  // Never trust client-provided role or userId.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || 
                    socket.handshake.headers?.authorization?.split(' ')[1] || 
                    socket.handshake.query?.token;
      
      if (!token) {
        return next(new Error('Authentication token required for Socket connection'));
      }

      jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
        if (err || !decodedUser) {
          return next(new Error('Unauthorized socket connection: Invalid or expired token'));
        }

        // Attach verified user payload to socket
        socket.user = decodedUser;
        next();
      });
    } catch (error) {
      return next(new Error('Socket authentication processing error'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    console.log(`[Socket.IO] Client connected: user_id=${user.id}, role=${user.role}, socket_id=${socket.id}`);

    // Join room for specific user ID
    socket.join(`user:${user.id}`);

    // Join room for user's role
    if (user.role) {
      socket.join(`role:${user.role}`);
    }

    // Join room for specific employee ID if available
    if (user.employee_id) {
      socket.join(`employee:${user.employee_id}`);
    }

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: user_id=${user.id}, reason=${reason}`);
    });
  });

  console.log('[Socket.IO] Real-time engine initialized successfully.');
  return io;
}

/**
 * Get Socket.IO instance
 */
function getIO() {
  return io;
}

/**
 * Broadcast event to all connected authenticated sockets
 */
function emitToAll(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

/**
 * Emit event to specific role room(s)
 */
function emitToRole(roles, event, data) {
  if (!io) return;
  const roleList = Array.isArray(roles) ? roles : [roles];
  roleList.forEach(role => {
    io.to(`role:${role}`).emit(event, data);
  });
}

/**
 * Emit event to a specific user room
 */
function emitToUser(userId, event, data) {
  if (io && userId) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

/**
 * Emit event to a specific employee room
 */
function emitToEmployee(employeeId, event, data) {
  if (io && employeeId) {
    io.to(`employee:${employeeId}`).emit(event, data);
  }
}

/**
 * Emit event to management roles and a specific user
 */
function emitToRolesAndUser(roles, userId, event, data) {
  if (!io) return;
  const roleList = Array.isArray(roles) ? roles : [roles];
  roleList.forEach(role => {
    io.to(`role:${role}`).emit(event, data);
  });
  if (userId) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

/**
 * Emit event to management roles and a specific employee
 */
function emitToRolesAndEmployee(roles, employeeId, event, data) {
  if (!io) return;
  const roleList = Array.isArray(roles) ? roles : [roles];
  roleList.forEach(role => {
    io.to(`role:${role}`).emit(event, data);
  });
  if (employeeId) {
    io.to(`employee:${employeeId}`).emit(event, data);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitToAll,
  emitToRole,
  emitToUser,
  emitToEmployee,
  emitToRolesAndUser,
  emitToRolesAndEmployee
};
