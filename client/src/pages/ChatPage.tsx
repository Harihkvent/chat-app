import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { useNavigate } from 'react-router-dom'
import ChatSidebar from '../components/ChatSidebar'
import ChatWindow from '../components/ChatWindow'
import { FiMenu, FiX } from 'react-icons/fi'

export interface Contact {
  _id: string
  username: string
  name: string
  email: string
  avatar?: string
  isOnline?: boolean
  lastSeen?: Date
}

export interface Message {
  _id?: string
  from: string
  to: string
  content: string
  type: 'text' | 'image' | 'video' | 'audio' | 'file'
  fileUrl?: string
  timestamp: Date
  read: boolean
  conversationId?: string
  sender?: {
    _id: string
    name: string
    username?: string
    avatar?: string
  }
  createdAt?: Date
  updatedAt?: Date
}

const ChatPage = () => {
  const { logout } = useAuth()
  const { isConnected } = useSocket()
  const navigate = useNavigate()
  const [activeContact, setActiveContact] = useState<Contact | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-whatsapp-green text-white p-2 rounded-lg shadow-lg"
      >
        {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative z-40 transition-transform duration-300 ease-in-out h-full`}
      >
        <ChatSidebar
          activeContact={activeContact}
          setActiveContact={setActiveContact}
          onLogout={handleLogout}
          isConnected={isConnected}
        />
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        <ChatWindow activeContact={activeContact} />
      </div>

      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg text-sm">
          Reconnecting...
        </div>
      )}
    </div>
  )
}

export default ChatPage
