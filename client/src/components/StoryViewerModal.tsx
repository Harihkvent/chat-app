import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getImageUrl, viewStory } from '../lib/api'
import { formatDistanceToNow } from 'date-fns'

interface Story {
  _id: string
  mediaUrl: string
  caption?: string
  createdAt: string
  expiresAt: string
}

interface UserStoriesGroup {
  user: {
    _id: string
    name: string
    username: string
    avatar?: string
  }
  stories: Story[]
}

interface StoryViewerModalProps {
  storyGroups: UserStoriesGroup[]
  initialGroupIndex?: number
  onClose: () => void
}

export default function StoryViewerModal({
  storyGroups,
  initialGroupIndex = 0,
  onClose,
}: StoryViewerModalProps) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex)
  const [storyIndex, setStoryIndex] = useState(0)

  const currentGroup = storyGroups[groupIndex]
  const currentStory = currentGroup?.stories[storyIndex]

  useEffect(() => {
    if (currentStory) {
      viewStory(currentStory._id).catch(() => {})
    }
  }, [currentStory])

  useEffect(() => {
    if (!currentStory) return
    const timer = setTimeout(() => {
      handleNext()
    }, 5000)
    return () => clearTimeout(timer)
  }, [groupIndex, storyIndex, currentStory])

  const handleNext = () => {
    if (!currentGroup) return
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(storyIndex + 1)
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex(groupIndex + 1)
      setStoryIndex(0)
    } else {
      onClose()
    }
  }

  const handlePrev = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1)
    } else if (groupIndex > 0) {
      setGroupIndex(groupIndex - 1)
      setStoryIndex(storyGroups[groupIndex - 1].stories.length - 1)
    }
  }

  if (!currentGroup || !currentStory) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      {/* Container */}
      <div className="relative w-full max-w-md h-[90vh] bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between">
        {/* Top Progress Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 p-3 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex space-x-1 mb-3">
            {currentGroup.stories.map((s, idx) => (
              <div key={s._id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-white transition-all duration-300 ${
                    idx < storyIndex ? 'w-full' : idx === storyIndex ? 'w-full animate-pulse' : 'w-0'
                  }`}
                ></div>
              </div>
            ))}
          </div>

          {/* User Info Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={currentGroup.user.avatar || `https://ui-avatars.com/api/?name=${currentGroup.user.name}`}
                alt={currentGroup.user.name}
                className="w-9 h-9 rounded-full object-cover border border-white/50"
              />
              <div>
                <p className="text-white text-sm font-semibold drop-shadow">{currentGroup.user.name}</p>
                <p className="text-white/70 text-xs">
                  {formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Media Image */}
        <div className="relative flex-1 flex items-center justify-center bg-black">
          <img
            src={getImageUrl(currentStory.mediaUrl)}
            alt="Story"
            className="w-full h-full object-contain"
          />

          {/* Navigation Click Zones */}
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Caption Overlay */}
        {currentStory.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent text-center">
            <p className="text-white text-sm font-medium drop-shadow">{currentStory.caption}</p>
          </div>
        )}
      </div>
    </div>
  )
}
