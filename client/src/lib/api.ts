import axios from 'axios'

export const getServerBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl
  }
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  return `http://${hostname}:4000`
}

const API = axios.create({
  baseURL: getServerBaseUrl(),
  withCredentials: true,
})

// Add a request interceptor to include auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add a response interceptor to handle auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or invalid
      console.error('Authentication error, clearing session')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth endpoints
export const signup = (data: any) => API.post('/api/auth/signup', data)
export const login = (data: { username: string; password: string }) =>
  API.post('/api/auth/login', data)
export const googleAuth = (data: { credential: string }) =>
  API.post('/api/auth/google', data)

// User & Social endpoints
export const getContacts = () => API.get('/api/users/contacts')
export const searchUsers = (query: string) => API.get(`/api/users/search?q=${query}`)
export const getUser = (userId: string) => API.get(`/api/users/${userId}`)
export const updateProfile = (data: any) => API.patch('/api/users/profile', data)
export const followUser = (userId: string) => API.post(`/api/users/${userId}/follow`)
export const unfollowUser = (userId: string) => API.delete(`/api/users/${userId}/follow`)
export const blockUser = (userId: string) => API.post(`/api/users/${userId}/block`)
export const unblockUser = (userId: string) => API.delete(`/api/users/${userId}/block`)
export const getBlockedUsers = () => API.get('/api/users/blocked')

// Post & Feed endpoints
export const getFeed = () => API.get('/api/posts/feed')
export const getUserPosts = (userId: string) => API.get(`/api/posts/user/${userId}`)
export const createPost = (formData: FormData) =>
  API.post('/api/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const likePost = (postId: string) => API.post(`/api/posts/${postId}/like`)
export const getComments = (postId: string) => API.get(`/api/posts/${postId}/comments`)
export const addComment = (postId: string, content: string) =>
  API.post(`/api/posts/${postId}/comments`, { content })
export const deletePost = (postId: string) => API.delete(`/api/posts/${postId}`)
export const toggleSavePost = (postId: string) => API.post(`/api/users/posts/${postId}/save`)
export const getSavedPosts = () => API.get('/api/users/saved-posts')

// Stories endpoints
export const getStoriesFeed = () => API.get('/api/stories')
export const createStory = (formData: FormData) =>
  API.post('/api/stories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const viewStory = (storyId: string) => API.post(`/api/stories/${storyId}/view`)

// Chat & Group endpoints
export const getConversations = () => API.get('/api/chats/conversations')
export const createConversation = (participantId: string) =>
  API.post('/api/chats/conversations', { participantId })
export const getMessages = (conversationId: string) =>
  API.get(`/api/chats/messages/${conversationId}`)
export const sendMessage = (data: {
  conversationId: string
  content: string
  type?: string
}) => API.post('/api/chats/messages', data)

export const createGroup = (data: { name: string; memberIds: string[]; description?: string }) =>
  API.post('/api/chats/groups', data)
export const getGroups = () => API.get('/api/chats/groups')

// Helper function to get full image URL
export const getImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  const baseURL = getServerBaseUrl()
  const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
  return `${baseURL}${cleanPath}`
}

export default API

