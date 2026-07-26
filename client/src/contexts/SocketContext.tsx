import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { token, user } = useAuth()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (token && user) {
      const userId = user._id || user.id
      if (!userId) return

      // Prevent duplicate connections
      if (socketRef.current?.connected) {
        console.log('Socket already connected, reusing existing connection')
        return
      }

      const envWsUrl = import.meta.env.VITE_WS_URL
      const socketUrl = (envWsUrl && !envWsUrl.includes('localhost'))
        ? envWsUrl
        : `http://${window.location.hostname}:4000`
      const newSocket = io(socketUrl, {
        auth: {
          token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      })

      socketRef.current = newSocket

      newSocket.on('connect', () => {
        console.log('🟢 Socket connected:', newSocket.id)
        setIsConnected(true)
        // Join user's room
        newSocket.emit('userOnline', userId)
      })

      newSocket.on('disconnect', (reason) => {
        console.log('🔴 Socket disconnected:', reason)
        setIsConnected(false)
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        setIsConnected(false)
      })

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts')
        setIsConnected(true)
        // Re-announce online status
        newSocket.emit('userOnline', userId)
      })

      setSocket(newSocket)

      return () => {
        if (socketRef.current) {
          socketRef.current.emit('userOffline', userId)
          socketRef.current.disconnect()
          socketRef.current = null
        }
      }
    } else {
      // Disconnect socket if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [token, user?._id, user?.id])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
