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
    console.log('📰 Loading feed...');
    console.log('   Current user:', user?.username, 'ID:', user?._id);
    try {
      console.log('   Making request to /api/posts/feed...');
      const response = await api.get("/api/posts/feed");
      console.log('✅ Feed loaded successfully');
      console.log('   Total posts:', response.data?.length);
      console.log('   Posts data:', response.data);
      setPosts(response.data);
      if (response.data?.length === 0) {
        console.warn('⚠️ No posts in feed - user might not be following anyone or no posts exist');
      }
    } catch (error: any) {
      console.error('❌ Error loading feed:', error);
      console.error('   Error response:', error.response?.data);
      console.error('   Error status:', error.response?.status);
      console.error('   Error message:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    console.log('❤️ Toggling like for post:', postId);
    try {
      const response = await api.post(`/api/posts/${postId}/like`);
      console.log('✅ Like toggled:', response.data);
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const liked = response.data.liked;
          console.log('   Post', postId, 'is now', liked ? 'liked' : 'unliked');
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
      console.error('❌ Error liking post:', error);
      console.error('   Error response:', error.response?.data);
    }
  };

  if (loading) {
    console.log('⏳ Feed is loading...');
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading feed...</p>
        </div>
      </div>
    );
  }

  console.log('🖼️ Rendering FeedPage with', posts.length, 'posts');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8">
        {/* Stories Section */}
        <div className="bg-white rounded-lg shadow mb-4 p-4">
          <div className="flex space-x-4 overflow-x-auto">
            <div className="flex flex-col items-center min-w-[80px]">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-600 p-0.5">
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`}
                    alt="Your story"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <span className="text-xs mt-1 text-gray-600">Your story</span>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 text-lg">No posts in feed</p>
              <p className="text-gray-400 text-sm mt-2">Follow users or create your first post to see content here!</p>
            </div>
          ) : (
            posts.map((post, idx) => {
              console.log(`📝 Rendering post ${idx + 1}:`, post._id, 'by', post.user?.username);
              return (
            <div key={post._id} className="bg-white rounded-lg shadow">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={post.user.avatar || `https://ui-avatars.com/api/?name=${post.user.name}`}
                    alt={post.user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-sm">{post.user.username || post.user.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <button className="text-gray-600 hover:text-gray-800" title="More options">
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
                        post.likes.includes(user!._id) ? "text-red-500" : "text-gray-700"
                      }`}
                      aria-label={post.likes.includes(user!._id) ? "Unlike post" : "Like post"}
                    >
                      <Heart
                        size={24}
                        fill={post.likes.includes(user!._id) ? "currentColor" : "none"}
                      />
                    </button>
                    <button className="text-gray-700" aria-label="Comment on post">
                      <MessageCircle size={24} />
                    </button>
                    <button className="text-gray-700" aria-label="Share post">
                      <Send size={24} />
                    </button>
                  </div>
                  <button className="text-gray-700" aria-label="Bookmark post">
                    <Bookmark size={24} />
                  </button>
                </div>

                {/* Likes Count */}
                <p className="font-semibold text-sm mb-2">
                  {post.likesCount} {post.likesCount === 1 ? "like" : "likes"}
                </p>

                {/* Caption */}
                {post.caption && (
                  <p className="text-sm">
                    <span className="font-semibold">{post.user.username || post.user.name}</span>{" "}
                    {post.caption}
                  </p>
                )}

                {/* Comments */}
                {post.commentsCount > 0 && (
                  <button className="text-sm text-gray-500 mt-2" type="button">
                    View all {post.commentsCount} comments
                  </button>
                )}
              </div>
            </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
