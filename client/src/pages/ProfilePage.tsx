import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api, { getImageUrl, getSavedPosts } from "../lib/api";
import { Settings, Grid, Bookmark, UserPlus, UserCheck, MessageCircle, Heart } from "lucide-react";

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
  isBlocked?: boolean;
  hasBlocked?: boolean;
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
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");

  const currentUserId = currentUser?._id || (currentUser as any)?.id;
  const isOwnProfile = !userId || userId === currentUserId;

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
    // Don't load if accessing own profile but user data not ready
    if (isOwnProfile && !currentUserId) {
      setLoading(false);
      return;
    }
    
    loadProfile();
    loadPosts();
  }, [userId, currentUser, authLoading]);

  useEffect(() => {
    if (activeTab === "saved" && isOwnProfile) {
      loadSavedPosts();
    }
  }, [activeTab]);

  const loadProfile = async () => {
    try {
      const targetId = userId || currentUserId;
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
      const targetId = userId || currentUserId;
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

  const loadSavedPosts = async () => {
    try {
      const response = await getSavedPosts();
      setSavedPosts(response.data);
    } catch (error) {
      console.error("Error loading saved posts:", error);
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
          followersCount: Math.max(0, profile.followersCount - 1)
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

  const handleBlock = async () => {
    if (!profile) return;
    try {
      if (profile.isBlocked) {
        await api.delete(`/api/users/${profile._id}/block`);
        setProfile({
          ...profile,
          isBlocked: false,
        });
      } else {
        await api.post(`/api/users/${profile._id}/block`);
        setProfile({
          ...profile,
          isBlocked: true,
          isFollowing: false,
          followersCount: Math.max(0, profile.followersCount - (profile.isFollowing ? 1 : 0)),
        });
        setPosts([]);
      }
    } catch (error) {
      console.error("Error blocking/unblocking user:", error);
    }
  };

  const handleMessage = () => {
    navigate("/chat");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-whatsapp-green"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-8 mb-4">
          <div className="flex items-start space-x-8">
            <img
              src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}&size=150`}
              alt={profile.name}
              className="w-32 h-32 rounded-full object-cover"
            />
            
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-2xl font-light text-gray-800 dark:text-white">{profile.username || profile.name}</h1>
                
                {isOwnProfile ? (
                  <button
                    onClick={() => navigate("/settings")}
                    className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    {!profile.isBlocked && (
                      <button
                        onClick={handleFollow}
                        className={`px-6 py-1.5 rounded-md text-sm font-semibold ${
                          profile.isFollowing
                            ? "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                            : "bg-whatsapp-green text-white hover:bg-whatsapp-teal"
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
                    )}
                    {!profile.isBlocked && (
                      <button
                        onClick={handleMessage}
                        className="px-6 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Message
                      </button>
                    )}
                    <button
                      onClick={handleBlock}
                      className={`px-4 py-1.5 rounded-md text-sm font-semibold ${
                        profile.isBlocked
                          ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-200"
                          : "border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      }`}
                    >
                      {profile.isBlocked ? "Unblock" : "Block"}
                    </button>
                  </div>
                )}

                {isOwnProfile && (
                  <button 
                    type="button"
                    aria-label="Settings"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200"
                  >
                    <Settings size={24} />
                  </button>
                )}
              </div>

              <div className="flex space-x-8 mb-4 text-gray-800 dark:text-gray-200">
                <div>
                  <span className="font-semibold">{profile.postsCount}</span> posts
                </div>
                <button className="hover:text-whatsapp-green">
                  <span className="font-semibold">{profile.followersCount}</span> followers
                </button>
                <button className="hover:text-whatsapp-green">
                  <span className="font-semibold">{profile.followingCount}</span> following
                </button>
              </div>

              <div>
                <p className="font-semibold text-gray-800 dark:text-white">{profile.name}</p>
                {profile.bio && <p className="text-sm text-gray-700 dark:text-gray-300">{profile.bio}</p>}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-whatsapp-teal font-semibold text-sm hover:underline"
                  >
                    {profile.website}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center space-x-2 ${
                activeTab === "posts"
                  ? "border-b-2 border-whatsapp-green text-whatsapp-green"
                  : "text-gray-400 dark:text-gray-500"
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
                    ? "border-b-2 border-whatsapp-green text-whatsapp-green"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                <Bookmark size={16} />
                <span>SAVED</span>
              </button>
            )}
          </div>

          {/* Posts Grid */}
          <div className="p-4">
            {((activeTab === "posts" ? posts : savedPosts) || []).length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {(activeTab === "posts" ? posts : savedPosts).map((post) => (
                  <div
                    key={post._id}
                    className="aspect-square relative group cursor-pointer overflow-hidden rounded"
                  >
                    <img
                      src={getImageUrl(post.imageUrl || "https://via.placeholder.com/400")}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center space-x-6 opacity-0 group-hover:opacity-100 transition-all">
                      <div className="flex items-center text-white font-semibold">
                        <Heart className="mr-2" size={20} fill="currentColor" />
                        {post.likesCount || 0}
                      </div>
                      <div className="flex items-center text-white font-semibold">
                        <MessageCircle className="mr-2" size={20} />
                        {post.commentsCount || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {activeTab === "posts" ? "No posts yet" : "No saved posts yet"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
