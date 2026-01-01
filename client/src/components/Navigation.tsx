import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Home, Search, PlusSquare, MessageCircle, User, LogOut } from "lucide-react";
import CreatePostModal from "./CreatePostModal";

export default function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreatePost, setShowCreatePost] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-300 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/feed" className="text-2xl font-bold">
              ChatApp
            </Link>

            {/* Search Bar */}
            <div className="hidden md:block flex-1 max-w-xs mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>
            </div>

            {/* Navigation Icons */}
            <div className="flex items-center space-x-6">
              <Link
                to="/feed"
                className={`hover:text-gray-600 ${isActive("/feed") ? "text-black" : "text-gray-700"}`}
              >
                <Home size={24} fill={isActive("/feed") ? "currentColor" : "none"} />
              </Link>

              <Link
                to="/chat"
                className={`hover:text-gray-600 ${isActive("/chat") ? "text-black" : "text-gray-700"}`}
              >
                <MessageCircle size={24} fill={isActive("/chat") ? "currentColor" : "none"} />
              </Link>

              <button
                onClick={() => setShowCreatePost(true)}
                className="hover:text-gray-600 text-gray-700"
                title="Create Post"
              >
                <PlusSquare size={24} />
              </button>

              <Link
                to="/profile"
                className={`hover:text-gray-600 ${isActive("/profile") ? "text-black" : "text-gray-700"}`}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className={`w-6 h-6 rounded-full object-cover ${
                      isActive("/profile") ? "ring-2 ring-black" : ""
                    }`}
                  />
                ) : (
                  <User size={24} fill={isActive("/profile") ? "currentColor" : "none"} />
                )}
              </Link>

              <button
                onClick={handleLogout}
                className="hover:text-gray-600 text-gray-700"
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
