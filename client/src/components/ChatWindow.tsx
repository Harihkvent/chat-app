import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { useCall } from '../contexts/CallContext'
import { Contact, Message } from '../pages/ChatPage'
import { FiSend, FiPaperclip, FiSmile, FiMoreVertical, FiPhone, FiVideo, FiX, FiFile } from 'react-icons/fi'
import { format } from 'date-fns'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
import axios from 'axios'
import { getImageUrl } from '../lib/api'

interface ChatWindowProps {
  activeContact: Contact | null
}

const ChatWindow = ({ activeContact }: ChatWindowProps) => {
  const { user, token } = useAuth()
  const { socket } = useSocket()
  const { startCall } = useCall()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!socket) return

    // Listen for incoming messages
    const handleReceiveMessage = (msg: any) => {
      console.log('Received message:', msg)
      if (msg.conversationId === conversationId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some(m => m._id === msg._id)) return prev
          return [...prev, msg]
        })
      }
    }

    // Listen for message sent confirmation
    const handleMessageSent = (msg: any) => {
      console.log('Message sent confirmation:', msg)
      setMessages((prev) => {
        // Replace temporary message with confirmed one
        const filtered = prev.filter(m => m.timestamp !== msg.timestamp || m._id)
        if (filtered.some(m => m._id === msg._id)) return filtered
        return [...filtered, msg]
      })
      setConversationId(msg.conversationId)
    }

    // Listen for typing indicator
    const handleUserTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === activeContact?._id) {
        setIsTyping(data.isTyping)
      }
    }

    // Listen for read receipts
    const handleMessageRead = (data: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId ? { ...msg, read: true } : msg
        )
      )
    }

    socket.on('receiveMessage', handleReceiveMessage)
    socket.on('messageSent', handleMessageSent)
    socket.on('userTyping', handleUserTyping)
    socket.on('messageRead', handleMessageRead)

    return () => {
      socket.off('receiveMessage', handleReceiveMessage)
      socket.off('messageSent', handleMessageSent)
      socket.off('userTyping', handleUserTyping)
      socket.off('messageRead', handleMessageRead)
    }
  }, [socket, activeContact, conversationId])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Load message history when contact changes
    const loadMessageHistory = async () => {
      if (!activeContact || !token) return
      
      setIsLoading(true)
      setMessages([])
      setConversationId(null)
      
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
        
        // Get or create conversation
        const convResponse = await axios.post(
          `${API_URL}/api/chats/conversations`,
          { participantId: activeContact._id },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        
        const conversation = convResponse.data
        setConversationId(conversation._id)
        
        // Load messages
        const messagesResponse = await axios.get(
          `${API_URL}/api/chats/messages/${conversation._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        
        setMessages(messagesResponse.data)
      } catch (error) {
        console.error('Error loading message history:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadMessageHistory()
  }, [activeContact, token])

  const handleSendMessage = async () => {
    if ((!message.trim() && !selectedFile) || !activeContact || !conversationId) return

    try {
      setUploading(true)
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
      
      if (selectedFile) {
        // Send file
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('conversationId', conversationId)
        formData.append('content', message.trim())

        const response = await axios.post(
          `${API_URL}/api/chats/messages`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        )

        // Emit to socket for real-time delivery
        if (socket && socket.connected) {
          socket.emit('sendMessage', {
            ...response.data,
            from: user!.id,
            to: activeContact._id,
          })
        }

        setMessages((prev) => [...prev, response.data])
        setSelectedFile(null)
        setFilePreview(null)
      } else {
        // Send text message via socket
        const tempTimestamp = new Date()
        const newMessage: Message = {
          from: user!.id,
          to: activeContact._id,
          content: message,
          type: 'text',
          timestamp: tempTimestamp,
          read: false,
          conversationId: conversationId || undefined,
        }

        // Optimistic update
        setMessages((prev) => [...prev, newMessage])
        
        // Emit to server
        if (socket) {
          socket.emit('sendMessage', {
            ...newMessage,
            conversationId: conversationId,
          })
        }
      }
      
      setMessage('')
      setShowEmojiPicker(false)

      // Stop typing indicator
      if (socket) {
        socket.emit('typing', { to: activeContact._id, isTyping: false })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setFilePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setFilePreview(null)
      }
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition"
            title="Voice call"
            onClick={() => {
              if (!activeContact) return
              if (activeContact.isGroup && activeContact.participants) {
                const peers = activeContact.participants
                  .filter(p => p._id !== user?.id)
                  .map(p => ({ id: p._id, name: p.name, avatar: p.avatar }))
                startCall(peers, 'audio', activeContact.groupName || activeContact.name)
              } else {
                startCall([{ id: activeContact._id, name: activeContact.name, avatar: activeContact.avatar }], 'audio')
              }
            }}
          >
            <FiPhone size={20} className="text-gray-600" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition"
            title="Video call"
            onClick={() => {
              if (!activeContact) return
              if (activeContact.isGroup && activeContact.participants) {
                const peers = activeContact.participants
                  .filter(p => p._id !== user?.id)
                  .map(p => ({ id: p._id, name: p.name, avatar: p.avatar }))
                startCall(peers, 'video', activeContact.groupName || activeContact.name)
              } else {
                startCall([{ id: activeContact._id, name: activeContact.name, avatar: activeContact.avatar }], 'video')
              }
            }}
          >
            <FiVideo size={20} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition" title="More options">
            <FiMoreVertical size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-center">
              Loading messages...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-center">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.from === user!.id || msg.sender?._id === user!.id
            const messageTime = msg.createdAt || msg.timestamp
            return (
              <div
                key={msg._id || `temp-${idx}`}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md rounded-lg ${
                    isOwn
                      ? 'bg-whatsapp-light text-gray-800'
                      : 'bg-white text-gray-800'
                  } shadow-sm overflow-hidden`}
                >
                  {/* File content */}
                  {msg.type === 'image' && msg.fileUrl && (
                    <img
                      src={getImageUrl(msg.fileUrl)}
                      alt="Shared image"
                      className="max-w-full h-auto cursor-pointer"
                      onClick={() => msg.fileUrl && window.open(getImageUrl(msg.fileUrl), '_blank')}
                    />
                  )}
                  {msg.type === 'video' && msg.fileUrl && (
                    <video
                      src={getImageUrl(msg.fileUrl)}
                      controls
                      className="max-w-full h-auto"
                    />
                  )}
                  {msg.type === 'audio' && msg.fileUrl && (
                    <audio
                      src={getImageUrl(msg.fileUrl)}
                      controls
                      className="w-full"
                    />
                  )}
                  {msg.type === 'file' && msg.fileUrl && (
                    <a
                      href={getImageUrl(msg.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 p-3 hover:bg-gray-100 transition"
                    >
                      <FiFile size={24} className="text-blue-600" />
                      <span className="text-sm truncate">{msg.content}</span>
                    </a>
                  )}
                  
                  {/* Text content */}
                  {msg.content && msg.type !== 'file' && (
                    <p className="break-words px-4 py-2">{msg.content}</p>
                  )}
                  
                  <div className="flex items-center justify-end space-x-1 px-4 pb-2">
                    <span className="text-xs text-gray-500">
                      {messageTime ? format(new Date(messageTime), 'HH:mm') : ''}
                    </span>
                    {isOwn && (
                      <span className="text-xs text-gray-500">
                        {msg.read ? '\u2713\u2713' : '\u2713'}
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
        {/* File Preview */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                  <FiFile size={24} className="text-gray-600" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-800 truncate max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 hover:bg-gray-200 rounded-full transition"
              title="Remove file"
            >
              <FiX size={20} className="text-gray-600" />
            </button>
          </div>
        )}

        <div className="flex items-end space-x-2">
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              title="Add emoji"
            >
              <FiSmile size={24} className="text-gray-600" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-10">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
            aria-label="Upload file"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            title="Attach file"
          >
            <FiPaperclip size={24} className="text-gray-600" />
          </button>
          <div className="flex-1 relative">
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-green resize-none max-h-[120px]"
              placeholder={selectedFile ? "Add a caption (optional)..." : "Type a message..."}
              value={message}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={(!message.trim() && !selectedFile) || uploading}
            className={`p-3 rounded-full transition ${
              (message.trim() || selectedFile) && !uploading
                ? 'bg-whatsapp-green text-white hover:bg-whatsapp-teal'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title="Send message"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <FiSend size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatWindow
