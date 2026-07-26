import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Home, Search, PlusSquare, MessageCircle, User, LogOut, Sun, Moon } from "lucide-react";
import CreatePostModal from "./CreatePostModal";
import { searchUsers } from "../lib/api";

export default function Navigation() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await searchUsers(query);
      setSearchResults(res.data || []);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/feed" className="text-2xl font-bold text-gray-800 dark:text-white">
              ChatApp
            </Link>

            {/* Search Bar */}
            <div className="hidden md:block flex-1 max-w-xs mx-8 relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-green text-sm"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>

              {/* Search Results Dropdown */}
              {searchQuery.trim() !== '' && (
                <div className="absolute left-0 right-0 top-12 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto z-50 p-2">
                  {searchResults.length === 0 ? (
                    <p className="p-3 text-xs text-gray-500 text-center">No users found</p>
                  ) : (
                    searchResults.map((u: any) => (
                      <div
                        key={u._id}
                        onClick={() => {
                          navigate(`/profile/${u._id}`);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition"
                      >
                        <img
                          src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}`}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{u.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{u.username || u.email}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Navigation Icons */}
            <div className="flex items-center space-x-5">
              <Link
                to="/feed"
                className={`hover:text-whatsapp-green transition-colors ${isActive("/feed") ? "text-whatsapp-green" : "text-gray-600 dark:text-gray-300"}`}
              >
                <Home size={24} fill={isActive("/feed") ? "currentColor" : "none"} />
              </Link>

              <Link
                to="/chat"
                className={`hover:text-whatsapp-green transition-colors ${isActive("/chat") ? "text-whatsapp-green" : "text-gray-600 dark:text-gray-300"}`}
              >
                <MessageCircle size={24} fill={isActive("/chat") ? "currentColor" : "none"} />
              </Link>

              <button
                onClick={() => setShowCreatePost(true)}
                className="hover:text-whatsapp-green transition-colors text-gray-600 dark:text-gray-300"
                title="Create Post"
              >
                <PlusSquare size={24} />
              </button>

              <Link
                to="/profile"
                className={`hover:text-whatsapp-green transition-colors ${isActive("/profile") ? "text-whatsapp-green" : "text-gray-600 dark:text-gray-300"}`}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className={`w-6 h-6 rounded-full object-cover ${
                      isActive("/profile") ? "ring-2 ring-whatsapp-green" : ""
                    }`}
                  />
                ) : (
                  <User size={24} fill={isActive("/profile") ? "currentColor" : "none"} />
                )}
              </Link>

              <button
                onClick={toggleTheme}
                className="hover:text-whatsapp-green transition-colors text-gray-600 dark:text-gray-300"
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? <Sun size={22} /> : <Moon size={22} />}
              </button>

              <button
                onClick={handleLogout}
                className="hover:text-red-500 transition-colors text-gray-600 dark:text-gray-300"
                title="Logout"
              >
                <LogOut size={24} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from going under fixed nav */}
      <div className="h-16"></div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          onPostCreated={() => {
            // Reload feed if on feed page
            if (location.pathname === "/feed") {
              window.location.reload();
            }
          }}
        />
      )}
    </>
  );
}
