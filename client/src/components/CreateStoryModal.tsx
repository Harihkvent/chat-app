import { useState, useRef } from 'react'
import { X, Image as ImageIcon, Send } from 'lucide-react'
import { createStory } from '../lib/api'

interface CreateStoryModalProps {
  onClose: () => void
  onStoryCreated: () => void
}

export default function CreateStoryModal({ onClose, onStoryCreated }: CreateStoryModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setError('Please select an image for your story')
      return
    }

    try {
      setLoading(true)
      setError('')
      const formData = new FormData()
      formData.append('image', selectedFile)
      if (caption.trim()) {
        formData.append('caption', caption.trim())
      }

      await createStory(formData)
      onStoryCreated()
      onClose()
    } catch (err: any) {
      console.error('Error creating story:', err)
      setError(err.response?.data?.error || 'Failed to post story')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-lg text-gray-800 dark:text-white">Create Story</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Media Selector / Preview */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden group hover:border-whatsapp-green transition"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Story Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <ImageIcon className="mx-auto text-gray-400 mb-2" size={40} />
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Click to select story photo</p>
                <p className="text-xs text-gray-400 mt-1">Disappears automatically after 24 hours</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Caption Input */}
          <input
            type="text"
            placeholder="Add a caption... (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-green text-sm"
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={!selectedFile || loading}
            className="w-full py-3 bg-whatsapp-green hover:bg-whatsapp-teal text-white font-semibold rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50 transition"
          >

            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Send size={18} />
                <span>Share Story</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
