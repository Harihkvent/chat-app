import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api, { getImageUrl, toggleSavePost, getStoriesFeed } from "../lib/api";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Plus } from "lucide-react";
import CommentsModal from "../components/CommentsModal";
import CreateStoryModal from "../components/CreateStoryModal";
import StoryViewerModal from "../components/StoryViewerModal";

interface Post {
  _id: string;
  user: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  caption?: string;
  imageUrl?: string;
  videoUrl?: string;
  likes: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export default function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Stories State
  const [storyGroups, setStoryGroups] = useState<any[]>([]);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);

  const currentUserId = user?._id || (user as any)?.id;

  useEffect(() => {
    loadFeed();
    loadStories();
  }, []);

  const loadFeed = async () => {
    try {
      const response = await api.get("/api/posts/feed");
      setPosts(response.data);
    } catch (error: any) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStories = async () => {
    try {
      const res = await getStoriesFeed();
      setStoryGroups(res.data || []);
    } catch (err) {
      console.error('Error loading stories feed:', err);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUserId) return;
    try {
      const response = await api.post(`/api/posts/${postId}/like`);
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const liked = response.data.liked;
          return {
            ...post,
            likes: liked 
              ? [...post.likes, currentUserId]
              : post.likes.filter(id => id !== currentUserId),
            likesCount: response.data.likesCount
          };
        }
        return post;
      }));
    } catch (error: any) {
      console.error('Error liking post:', error);
    }
  };

  const handleSavePost = async (postId: string) => {
    try {
      const res = await toggleSavePost(postId);
      const isSaved = res.data.saved;
      if (isSaved) {
        setSavedPostIds(prev => [...prev, postId]);
        showToast("Post saved to profile!");
      } else {
        setSavedPostIds(prev => prev.filter(id => id !== postId));
        showToast("Post removed from saved!");
      }
    } catch (err) {
      console.error("Error saving post:", err);
    }
  };

  const handleSharePost = (postId: string) => {
    const shareUrl = `${window.location.origin}/feed#${postId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast("Post link copied to clipboard!");
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-whatsapp-green mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-2xl animate-fade-in flex items-center space-x-2 border border-gray-700">
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Stories Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-700/20 mb-6 p-4">
          <div className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-none">
            {/* Create Story Circle */}
            <div className="flex flex-col items-center min-w-[76px] cursor-pointer" onClick={() => setShowCreateStory(true)}>
              <div className="relative w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 p-0.5 border-2 border-dashed border-whatsapp-green flex items-center justify-center">
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`}
                  alt="Your story"
                  className="w-full h-full rounded-full object-cover opacity-80"
                />
                <div className="absolute bottom-0 right-0 bg-whatsapp-green text-white rounded-full p-1 border-2 border-white dark:border-gray-800">
                  <Plus size={12} />
                </div>
              </div>
              <span className="text-xs mt-1.5 text-gray-700 dark:text-gray-300 font-medium">Add Story</span>
            </div>

            {/* Active Story Rings */}
            {storyGroups.map((group, idx) => (
              <div
                key={group.user._id}
                onClick={() => setViewingStoryIndex(idx)}
                className="flex flex-col items-center min-w-[76px] cursor-pointer group"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5 shadow-md transform group-hover:scale-105 transition">
                  <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5">
                    <img
                      src={group.user.avatar || `https://ui-avatars.com/api/?name=${group.user.name}`}
                      alt={group.user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                <span className="text-xs mt-1.5 text-gray-700 dark:text-gray-300 font-medium truncate max-w-[70px]">
                  {group.user.username || group.user.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-700/20 p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-lg font-semibold">No posts in your feed</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Follow other users or create your first post to see content here!
              </p>
            </div>
          ) : (
            posts.map((post) => {
              const isLiked = currentUserId && post.likes.includes(currentUserId);
              const isSaved = savedPostIds.includes(post._id);

              return (
                <div key={post._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-700/20 overflow-hidden border border-gray-100 dark:border-gray-700/50">
                  {/* Post Header */}
                  <div className="flex items-center justify-between p-4">
                    <div
                      onClick={() => navigate(`/profile/${post.user._id}`)}
                      className="flex items-center space-x-3 cursor-pointer group"
                    >
                      <img
                        src={post.user.avatar || `https://ui-avatars.com/api/?name=${post.user.name}`}
                        alt={post.user.name}
                        className="w-10 h-10 rounded-full object-cover group-hover:opacity-90"
                      />
                      <div>
                        <p className="font-semibold text-sm text-gray-800 dark:text-white group-hover:text-whatsapp-green transition">
                          {post.user.username || post.user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <button className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-1 rounded-full" title="Options">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>

                  {/* Post Media */}
                  {post.imageUrl && (
                    <div className="bg-black/5 dark:bg-black/20 flex items-center justify-center">
                      <img
                        src={getImageUrl(post.imageUrl)}
                        alt="Post media"
                        className="w-full max-h-[650px] object-cover"
                      />
                    </div>
                  )}

                  {/* Post Actions Bar */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleLike(post._id)}
                          className={`transition-transform active:scale-125 ${
                            isLiked ? "text-red-500" : "text-gray-700 dark:text-gray-300 hover:text-red-500"
                          }`}
                          aria-label={isLiked ? "Unlike post" : "Like post"}
                        >
                          <Heart
                            size={24}
                            fill={isLiked ? "currentColor" : "none"}
                          />
                        </button>
                        <button
                          onClick={() => setActiveCommentPostId(post._id)}
                          className="text-gray-700 dark:text-gray-300 hover:text-whatsapp-green transition"
                          aria-label="Comment on post"
                        >
                          <MessageCircle size={24} />
                        </button>
                        <button
                          onClick={() => handleSharePost(post._id)}
                          className="text-gray-700 dark:text-gray-300 hover:text-whatsapp-green transition"
                          aria-label="Share post"
                        >
                          <Send size={24} />
                        </button>
                      </div>
                      <button
                        onClick={() => handleSavePost(post._id)}
                        className={`transition ${
                          isSaved ? "text-whatsapp-green" : "text-gray-700 dark:text-gray-300 hover:text-whatsapp-green"
                        }`}
                        aria-label="Save post"
                      >
                        <Bookmark size={24} fill={isSaved ? "currentColor" : "none"} />
                      </button>
                    </div>

                    {/* Likes Count */}
                    <p className="font-semibold text-sm mb-2 text-gray-800 dark:text-white">
                      {post.likesCount} {post.likesCount === 1 ? "like" : "likes"}
                    </p>

                    {/* Caption */}
                    {post.caption && (
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        <span
                          onClick={() => navigate(`/profile/${post.user._id}`)}
                          className="font-semibold cursor-pointer hover:underline mr-2"
                        >
                          {post.user.username || post.user.name}
                        </span>
                        {post.caption}
                      </p>
                    )}

                    {/* Comments Trigger */}
                    {post.commentsCount > 0 ? (
                      <button
                        onClick={() => setActiveCommentPostId(post._id)}
                        className="text-sm text-gray-500 dark:text-gray-400 mt-2 hover:underline block"
                        type="button"
                      >
                        View all {post.commentsCount} comments
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveCommentPostId(post._id)}
                        className="text-sm text-gray-400 dark:text-gray-500 mt-2 hover:underline block"
                        type="button"
                      >
                        Add a comment...
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Comments Modal */}
      {activeCommentPostId && (
        <CommentsModal
          postId={activeCommentPostId}
          onClose={() => setActiveCommentPostId(null)}
          onCommentAdded={() => {
            setPosts(prev =>
              prev.map(p =>
                p._id === activeCommentPostId ? { ...p, commentsCount: p.commentsCount + 1 } : p
              )
            );
          }}
        />
      )}

      {/* Create Story Modal */}
      {showCreateStory && (
        <CreateStoryModal
          onClose={() => setShowCreateStory(false)}
          onStoryCreated={() => loadStories()}
        />
      )}

      {/* Story Viewer Modal */}
      {viewingStoryIndex !== null && (
        <StoryViewerModal
          storyGroups={storyGroups}
          initialGroupIndex={viewingStoryIndex}
          onClose={() => setViewingStoryIndex(null)}
        />
      )}
    </div>
  );
}
