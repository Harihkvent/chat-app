import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getContacts, searchUsers } from '../lib/api'
import { Contact } from '../pages/ChatPage'
import {
  FiSearch,
  FiLogOut,
  FiUser,
  FiMessageCircle,
  FiSettings,
  FiUsers,
} from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'

interface ChatSidebarProps {
  activeContact: Contact | null
  setActiveContact: (contact: Contact) => void
  onLogout: () => void
  isConnected: boolean
}

const ChatSidebar = ({
  activeContact,
  setActiveContact,
  onLogout,
  isConnected,
}: ChatSidebarProps) => {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      const res = await getContacts()
      setContacts(res.data)
      if (res.data.length > 0 && !activeContact) {
        setActiveContact(res.data[0])
      }
    } catch (error) {
      console.error('Failed to load contacts:', error)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const res = await searchUsers(query)
      setSearchResults(res.data)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const displayContacts = searchQuery.trim() ? searchResults : contacts

  return (
    <div className="w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="bg-whatsapp-green text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-whatsapp-green font-bold">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                getInitials(user?.name || 'U')
              )}
            </div>
            <div>
              <h2 className="font-semibold">{user?.name}</h2>
              <p className="text-xs opacity-90">
                {isConnected ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-whatsapp-teal rounded-full transition">
              <FiUsers size={20} />
            </button>
            <button className="p-2 hover:bg-whatsapp-teal rounded-full transition">
              <FiSettings size={20} />
            </button>
            <button
              onClick={onLogout}
              className="p-2 hover:bg-red-500 rounded-full transition"
              title="Logout"
            >
              <FiLogOut size={20} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search or start new chat"
            className="w-full pl-10 pr-4 py-2 rounded-lg text-gray-800 focus:outline-none"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
          </div>
        ) : displayContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <FiMessageCircle size={48} className="mb-3 opacity-50" />
            <p className="text-center">
              {searchQuery ? 'No users found' : 'No contacts yet'}
            </p>
            <p className="text-sm text-center mt-1">
              {searchQuery ? 'Try a different search' : 'Start a new conversation!'}
            </p>
          </div>
        ) : (
          displayContacts.map((contact) => (
            <div
              key={contact._id}
              onClick={() => {
                setActiveContact(contact)
                setSearchQuery('')
                setSearchResults([])
              }}
              className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition ${
                activeContact?._id === contact._id ? 'bg-gray-100' : ''
              }`}
            >
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-whatsapp-green to-whatsapp-teal rounded-full flex items-center justify-center text-white font-bold">
                  {contact.avatar ? (
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    getInitials(contact.name)
                  )}
                </div>
                {contact.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {contact.name}
                  </h3>
                  {contact.lastSeen && (
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(contact.lastSeen), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate">
                  @{contact.username}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ChatSidebar
