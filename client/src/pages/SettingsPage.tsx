import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";
import { Camera, Save, ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    website: "",
    isPrivate: false,
  });
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        username: user.username || "",
        bio: (user as any).bio || "",
        website: (user as any).website || "",
        isPrivate: (user as any).isPrivate || false,
      });
      setAvatar(user.avatar || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await api.patch("/api/users/profile", {
        ...formData,
        avatar,
      });

      // Update auth context with new user data
      const token = localStorage.getItem("token");
      if (token) {
        login(token, response.data);
      }

      setMessage("Profile updated successfully!");
      setTimeout(() => {
        navigate("/profile");
      }, 1500);
    } catch (error: any) {
      console.error("Update error:", error);
      setMessage(error.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setAvatar(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center space-x-4">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              title="Back to profile"
              aria-label="Back to profile"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Edit Profile</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Avatar */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <img
                  src={
                    avatar ||
                    `https://ui-avatars.com/api/?name=${formData.name}&size=100`
                  }
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div className="absolute bottom-0 right-0 bg-whatsapp-green rounded-full p-2">
                  <Camera size={16} className="text-white" />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={avatar}
                  onChange={handleAvatarChange}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enter a URL for your profile picture
                </p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
                required
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
                required
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
                placeholder="Tell us about yourself..."
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
                placeholder="https://example.com"
              />
            </div>

            {/* Private Account */}
            <div className="flex items-center">
              <label htmlFor="isPrivate" className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={formData.isPrivate}
                  onChange={(e) =>
                    setFormData({ ...formData, isPrivate: e.target.checked })
                  }
                  className="h-4 w-4 text-whatsapp-green focus:ring-whatsapp-green border-gray-300 dark:border-gray-600 rounded"
                />
                <span className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Private Account
                </span>
              </label>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-3 rounded-md ${
                  message.includes("success")
                    ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                    : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                }`}
              >
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-whatsapp-green text-white py-2 px-4 rounded-md hover:bg-whatsapp-teal disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save size={18} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
