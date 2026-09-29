import { Server } from 'socket.io';
import cookie from 'cookie';
import { verifyAccessToken } from './utils/jwt.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) {
        return next(new Error('Authentication error'));
      }

      const parsedCookies = cookie.parse(cookies);
      const token = parsedCookies.accessToken;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} for user: ${socket.user.userId}`);
    
    // Join the org-specific room
    const orgRoom = `org_${socket.user.orgId}`;
    socket.join(orgRoom);
    console.log(`Socket ${socket.id} joined room: ${orgRoom}`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const emitToOrg = (orgId, eventName, payload) => {
  if (io) {
    io.to(`org_${orgId}`).emit(eventName, payload);
  }
};
