import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api, { getImageUrl } from "../lib/api";
import { Settings, Grid, Bookmark, UserPlus, UserCheck, MessageCircle } from "lucide-react";

interface UserProfile {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  website?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isPrivate: boolean;
  isFollowing: boolean;
  isFollower: boolean;
}

interface Post {
  _id: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
}

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");

  const isOwnProfile = !userId || userId === currentUser?._id;

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
    // Don't load if accessing own profile but user data not ready
    if (isOwnProfile && !currentUser) {
      setLoading(false);
      return;
    }
    
    loadProfile();
    loadPosts();
  }, [userId, currentUser, authLoading]);

  const loadProfile = async () => {
    try {
      const targetId = userId || currentUser?._id;
      if (!targetId) {
        console.error('No userId available');
        return;
      }
      const response = await api.get(`/api/users/${targetId}`);
      setProfile(response.data);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const targetId = userId || currentUser?._id;
      if (!targetId) {
        console.error('No userId available for loading posts');
        return;
      }
      const response = await api.get(`/api/posts/user/${targetId}`);
      setPosts(response.data);
    } catch (error) {
      console.error("Error loading posts:", error);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;
    
    try {
      if (profile.isFollowing) {
        await api.delete(`/api/users/${profile._id}/follow`);
        setProfile({
          ...profile,
          isFollowing: false,
          followersCount: profile.followersCount - 1
        });
      } else {
        await api.post(`/api/users/${profile._id}/follow`);
        setProfile({
          ...profile,
          isFollowing: true,
          followersCount: profile.followersCount + 1
        });
      }
    } catch (error) {
      console.error("Error following/unfollowing:", error);
    }
  };

  const handleMessage = () => {
    navigate("/chat");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-8 mb-4">
          <div className="flex items-start space-x-8">
            <img
              src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}&size=150`}
              alt={profile.name}
              className="w-32 h-32 rounded-full object-cover"
            />
            
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-2xl font-light">{profile.username || profile.name}</h1>
                
                {isOwnProfile ? (
                  <button
                    onClick={() => navigate("/settings")}
                    className="px-4 py-1.5 border border-gray-300 rounded-md text-sm font-semibold hover:bg-gray-50"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleFollow}
                      className={`px-6 py-1.5 rounded-md text-sm font-semibold ${
                        profile.isFollowing
                          ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {profile.isFollowing ? (
                        <span className="flex items-center">
                          <UserCheck size={16} className="mr-1" /> Following
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <UserPlus size={16} className="mr-1" /> Follow
                        </span>
                      )}
                    </button>
                    <button
                      onClick={handleMessage}
                      className="px-6 py-1.5 border border-gray-300 rounded-md text-sm font-semibold hover:bg-gray-50"
                    >
                      Message
                    </button>
                  </div>
                )}

                {isOwnProfile && (
                  <button 
                    type="button"
                    aria-label="Settings"
                    className="p-2 hover:bg-gray-100 rounded-md"
                  >
                    <Settings size={24} />
                  </button>
                )}
              </div>

              <div className="flex space-x-8 mb-4">
                <div>
                  <span className="font-semibold">{profile.postsCount}</span> posts
                </div>
                <button className="hover:text-gray-600">
                  <span className="font-semibold">{profile.followersCount}</span> followers
                </button>
                <button className="hover:text-gray-600">
                  <span className="font-semibold">{profile.followingCount}</span> following
                </button>
              </div>

              <div>
                <p className="font-semibold">{profile.name}</p>
                {profile.bio && <p className="text-sm">{profile.bio}</p>}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-900 font-semibold text-sm hover:underline"
                  >
                    {profile.website}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center space-x-2 ${
                activeTab === "posts"
                  ? "border-b-2 border-gray-800 text-gray-800"
                  : "text-gray-400"
              }`}
            >
              <Grid size={16} />
              <span>POSTS</span>
            </button>
            {isOwnProfile && (
              <button
                onClick={() => setActiveTab("saved")}
                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center space-x-2 ${
                  activeTab === "saved"
                    ? "border-b-2 border-gray-800 text-gray-800"
                    : "text-gray-400"
                }`}
              >
                <Bookmark size={16} />
                <span>SAVED</span>
              </button>
            )}
          </div>

          {/* Posts Grid */}
          <div className="p-4">
            {posts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {posts.map((post) => (
                  <div
                    key={post._id}
                    className="aspect-square relative group cursor-pointer"
                  >
                    <img
                      src={getImageUrl(post.imageUrl || "https://via.placeholder.com/400")}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center space-x-6 opacity-0 group-hover:opacity-100 transition-all">
                      <div className="flex items-center text-white font-semibold">
                        <span className="mr-2">❤️</span>
                        {post.likesCount}
                      </div>
                      <div className="flex items-center text-white font-semibold">
                        <MessageCircle className="mr-2" size={20} />
                        {post.commentsCount}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No posts yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
