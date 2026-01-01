import { useState, useRef } from "react";
import { X, Image as ImageIcon, Smile } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

interface CreatePostModalProps {
  onClose: () => void;
  onPostCreated: () => void;
}

export default function CreatePostModal({ onClose, onPostCreated }: CreatePostModalProps) {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('📁 File selected:', file?.name, 'Type:', file?.type, 'Size:', file?.size);
    if (file) {
      setImageFile(file);
      setImageUrl(""); // Clear URL if file is selected
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('🖼️ File preview created');
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📤 Starting post submission...');
    console.log('   User:', user?.username, 'ID:', user?._id);
    console.log('   Caption:', caption);
    console.log('   Image file:', imageFile?.name);
    console.log('   Image URL:', imageUrl);
    
    if (!imageFile && !imageUrl.trim()) {
      console.warn('⚠️ No image provided');
      alert("Please add an image");
      return;
    }

    setLoading(true);
    try {
      if (imageFile) {
        console.log('📸 Uploading image file...');
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("caption", caption.trim());
        console.log('   FormData keys:', Array.from(formData.keys()));

        const response = await api.post("/api/posts", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        console.log('✅ Post created successfully (file):', response.data);
      } else {
        console.log('🔗 Creating post with URL...');
        const response = await api.post("/api/posts", {
          caption: caption.trim(),
          imageUrl: imageUrl.trim()
        });
        console.log('✅ Post created successfully (URL):', response.data);
      }
      
      console.log('🔄 Calling onPostCreated callback...');
      onPostCreated();
      console.log('❌ Closing modal...');
      onClose();
    } catch (error: any) {
      console.error('❌ Error creating post:', error);
      console.error('   Error response:', error.response?.data);
      console.error('   Error status:', error.response?.status);
      console.error('   Error message:', error.message);
      alert("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Create new post</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex items-start space-x-3 mb-4">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`}
              alt={user?.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold text-sm">{user?.username || user?.name}</p>
            </div>
          </div>

          <div className="mb-4">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>

          <div className="mb-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image from Device
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Upload image file"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600 font-medium"
              >
                {imageFile ? imageFile.name : "Choose an image file"}
              </button>
            </div>

            {!imageFile && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="text-sm text-gray-500">OR</span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://example.com/image.jpg"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>

          {imagePreview && (
            <div className="mb-4 relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
                onError={() => {
                  setImagePreview("");
                  if (!imageFile) setImageUrl("");
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImageUrl("");
                  setImagePreview("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                aria-label="Remove image"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-gray-100 rounded-full"
                title="Add photo from device"
              >
                <ImageIcon size={20} className="text-gray-600" />
              </button>
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-full"
                title="Add emoji"
              >
                <Smile size={20} className="text-gray-600" />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || (!imageFile && !imageUrl.trim())}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Posting..." : "Share"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
