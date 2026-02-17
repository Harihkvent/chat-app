import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import api, { getImageUrl } from "../lib/api";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
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

  const handleLike = async (postId: string) => {
    try {
      const response = await api.post(`/api/posts/${postId}/like`);
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const liked = response.data.liked;
          return {
            ...post,
            likes: liked 
              ? [...post.likes, user!._id]
              : post.likes.filter(id => id !== user!._id),
            likesCount: response.data.likesCount
          };
        }
        return post;
      }));
    } catch (error: any) {
      console.error('Error liking post:', error);
    }
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto py-8">
        {/* Stories Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 mb-4 p-4">
          <div className="flex space-x-4 overflow-x-auto">
            <div className="flex flex-col items-center min-w-[80px]">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-whatsapp-green to-whatsapp-teal p-0.5">
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5">
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`}
                    alt="Your story"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">Your story</span>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-lg">No posts in feed</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Follow users or create your first post to see content here!</p>
            </div>
          ) : (
            posts.map((post) => (
            <div key={post._id} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={post.user.avatar || `https://ui-avatars.com/api/?name=${post.user.name}`}
                    alt={post.user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-white">{post.user.username || post.user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <button className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white" title="More options">
                  <MoreHorizontal size={20} />
                </button>
              </div>

              {/* Post Image */}
              {post.imageUrl && (
                <img
                  src={getImageUrl(post.imageUrl)}
                  alt="Post"
                  className="w-full max-h-[600px] object-cover"
                />
              )}

              {/* Post Actions */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLike(post._id)}
                      className={`transition-colors ${
                        post.likes.includes(user!._id) ? "text-red-500" : "text-gray-700 dark:text-gray-300"
                      }`}
                      aria-label={post.likes.includes(user!._id) ? "Unlike post" : "Like post"}
                    >
                      <Heart
                        size={24}
                        fill={post.likes.includes(user!._id) ? "currentColor" : "none"}
                      />
                    </button>
                    <button className="text-gray-700 dark:text-gray-300" aria-label="Comment on post">
                      <MessageCircle size={24} />
                    </button>
                    <button className="text-gray-700 dark:text-gray-300" aria-label="Share post">
                      <Send size={24} />
                    </button>
                  </div>
                  <button className="text-gray-700 dark:text-gray-300" aria-label="Bookmark post">
                    <Bookmark size={24} />
                  </button>
                </div>

                {/* Likes Count */}
                <p className="font-semibold text-sm mb-2 text-gray-800 dark:text-white">
                  {post.likesCount} {post.likesCount === 1 ? "like" : "likes"}
                </p>

                {/* Caption */}
                {post.caption && (
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <span className="font-semibold">{post.user.username || post.user.name}</span>{" "}
                    {post.caption}
                  </p>
                )}

                {/* Comments */}
                {post.commentsCount > 0 && (
                  <button className="text-sm text-gray-500 dark:text-gray-400 mt-2" type="button">
                    View all {post.commentsCount} comments
                  </button>
                )}
              </div>
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
