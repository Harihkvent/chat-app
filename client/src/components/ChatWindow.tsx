import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { Contact, Message } from '../pages/ChatPage'
import { FiSend, FiPaperclip, FiSmile, FiMoreVertical, FiPhone, FiVideo } from 'react-icons/fi'
import { format } from 'date-fns'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'

interface ChatWindowProps {
  activeContact: Contact | null
}

const ChatWindow = ({ activeContact }: ChatWindowProps) => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!socket) return

    // Listen for incoming messages
    socket.on('receiveMessage', (msg: Message) => {
      setMessages((prev) => [...prev, msg])
    })

    // Listen for typing indicator
    socket.on('userTyping', (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === activeContact?._id) {
        setIsTyping(data.isTyping)
      }
    })

    // Listen for read receipts
    socket.on('messageRead', (data: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId ? { ...msg, read: true } : msg
        )
      )
    })

    return () => {
      socket.off('receiveMessage')
      socket.off('userTyping')
      socket.off('messageRead')
    }
  }, [socket, activeContact])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Clear messages when contact changes
    setMessages([])
    // TODO: Load message history from API
  }, [activeContact])

  const handleSendMessage = () => {
    if (!message.trim() || !activeContact || !socket) return

    const newMessage: Message = {
      from: user!.id,
      to: activeContact._id,
      content: message,
      type: 'text',
      timestamp: new Date(),
      read: false,
    }

    socket.emit('sendMessage', newMessage)
    setMessages((prev) => [...prev, newMessage])
    setMessage('')
    setShowEmojiPicker(false)

    // Stop typing indicator
    socket.emit('typing', { to: activeContact._id, isTyping: false })
  }

  const handleTyping = (value: string) => {
    setMessage(value)

    if (!socket || !activeContact) return

    // Send typing indicator
    socket.emit('typing', { to: activeContact._id, isTyping: true })

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { to: activeContact._id, isTyping: false })
    }, 1000)
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
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

  if (!activeContact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <FiSend size={48} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Welcome to Chat App
          </h2>
          <p className="text-gray-500">
            Select a contact to start messaging
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#efeae2]">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-whatsapp-green to-whatsapp-teal rounded-full flex items-center justify-center text-white font-bold">
              {activeContact.avatar ? (
                <img
                  src={activeContact.avatar}
                  alt={activeContact.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                getInitials(activeContact.name)
              )}
            </div>
            {activeContact.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{activeContact.name}</h3>
            <p className="text-xs text-gray-600">
              {isTyping ? (
                <span className="text-whatsapp-green animate-pulse">typing...</span>
              ) : activeContact.isOnline ? (
                'online'
              ) : (
                'offline'
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition">
            <FiPhone size={20} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition">
            <FiVideo size={20} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition">
            <FiMoreVertical size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-center">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.from === user!.id
            return (
              <div
                key={idx}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'bg-whatsapp-light text-gray-800'
                      : 'bg-white text-gray-800'
                  } shadow-sm`}
                >
                  <p className="break-words">{msg.content}</p>
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    <span className="text-xs text-gray-500">
                      {format(new Date(msg.timestamp), 'HH:mm')}
                    </span>
                    {isOwn && (
                      <span className="text-xs">
                        {msg.read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-end space-x-2">
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <FiSmile size={24} className="text-gray-600" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-10">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full transition">
            <FiPaperclip size={24} className="text-gray-600" />
          </button>
          <div className="flex-1 relative">
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-green resize-none"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
              style={{ maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className={`p-3 rounded-full transition ${
              message.trim()
                ? 'bg-whatsapp-green text-white hover:bg-whatsapp-teal'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <FiSend size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatWindow
