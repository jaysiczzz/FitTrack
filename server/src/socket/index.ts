import { Server as HttpServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { verifyToken, jwtPayload } from '../utils/jwt.utils'
import { prisma } from '../config/db'

export interface AuthenticatedSocket extends Socket {
  user?: jwtPayload & { role?: string }
}

let io: SocketIOServer | null = null

export function initSocketServer(httpServer: HttpServer, allowedOrigins: string[]): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true)
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true)
        if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
          return callback(null, true)
        }
        return callback(null, true) // Allow mobile app sockets
      },
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 25000,
  })

  // Authentication Middleware for Sockets
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization
      const token = authHeader ? (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader) : null

      if (!token) {
        return next()
      }

      const payload = verifyToken(token)
      if (payload?.id) {
        const user = await prisma.user.findUnique({
          where: { id: payload.id },
          select: { id: true, role: true, isSuspended: true },
        })

        if (user && !user.isSuspended) {
          socket.user = {
            ...payload,
            role: user.role,
          }
        }
      }
      next()
    } catch {
      // Proceed as unauthenticated guest
      next()
    }
  })

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user?.id
    const userRole = socket.user?.role

    // Every socket joins community room for live social features
    socket.join('community_channel')

    if (userId) {
      // Private room for all devices belonging to this user
      socket.join(`user_${userId}`)
      // Active workout room for this user
      socket.join(`workout_${userId}`)

      if (userRole === 'ADMIN') {
        socket.join('admin_channel')
      }
    }

    // Workout cross-device relay (e.g. Phone ➔ Tablet)
    socket.on('workout:sync_state', (payload) => {
      if (userId) {
        socket.to(`workout_${userId}`).emit('workout:state_updated', payload)
      }
    })

    socket.on('workout:timer_tick', (payload) => {
      if (userId) {
        socket.to(`workout_${userId}`).emit('workout:timer_synced', payload)
      }
    })

    socket.on('disconnect', () => {
      // Room cleanup is handled automatically by socket.io
    })
  })

  return io
}

export function getIO(): SocketIOServer | null {
  return io
}

/**
 * Emit event to all connected devices belonging to a specific user.
 */
export function emitToUser(userId: string, event: string, data: any) {
  if (!io) return
  io.to(`user_${userId}`).emit(event, data)
}

/**
 * Emit event to all connected administrators.
 */
export function emitToAdmin(event: string, data: any) {
  if (!io) return
  io.to('admin_channel').emit(event, data)
}

/**
 * Emit event to all connected clients across the community.
 */
export function emitToCommunity(event: string, data: any) {
  if (!io) return
  io.to('community_channel').emit(event, data)
}
