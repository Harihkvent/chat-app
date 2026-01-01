import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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

  useEffect(() => {
    if (token && user) {
      const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:4000'
      const newSocket = io(socketUrl, {
        auth: {
          token,
        },
      })

      newSocket.on('connect', () => {
        console.log('🟢 Socket connected:', newSocket.id)
        setIsConnected(true)
        // Join user's room
        newSocket.emit('userOnline', user.id)
      })

      newSocket.on('disconnect', () => {
        console.log('🔴 Socket disconnected')
        setIsConnected(false)
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        setIsConnected(false)
      })

      setSocket(newSocket)

      return () => {
        if (newSocket) {
          newSocket.emit('userOffline', user.id)
          newSocket.disconnect()
        }
      }
    } else {
      // Disconnect socket if user logs out
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [token, user])

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
