import { useState, useEffect } from 'react'
import { X, Send } from 'lucide-react'
import { getComments, addComment } from '../lib/api'
import { formatDistanceToNow } from 'date-fns'

interface Comment {
  _id: string
  user: {
    _id: string
    name: string
    username: string
    avatar?: string
  }
  content: string
  createdAt: string
}

interface CommentsModalProps {
  postId: string
  onClose: () => void
  onCommentAdded?: () => void
}

export default function CommentsModal({ postId, onClose, onCommentAdded }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadComments()
  }, [postId])

  const loadComments = async () => {
    try {
      setLoading(true)
      const res = await getComments(postId)
      setComments(res.data || [])
    } catch (err) {
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      setSubmitting(true)
      const res = await addComment(postId, newComment.trim())
      setComments([res.data, ...comments])
      setNewComment('')
      if (onCommentAdded) onCommentAdded()
    } catch (err) {
      console.error('Error adding comment:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-lg text-gray-800 dark:text-white">Comments</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Comment List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="flex items-start space-x-3">
                <img
                  src={comment.user.avatar || `https://ui-avatars.com/api/?name=${comment.user.name}`}
                  alt={comment.user.name}
                  className="w-8 h-8 rounded-full object-cover mt-0.5"
                />
                <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-gray-800 dark:text-white">
                      {comment.user.username || comment.user.name}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="p-2.5 bg-whatsapp-green hover:bg-whatsapp-teal text-white rounded-full disabled:opacity-50 transition"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
