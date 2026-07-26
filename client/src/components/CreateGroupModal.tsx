import { useState } from "react";
import { X, Search, Check } from "lucide-react";
import api from "../lib/api";

interface Contact {
  _id: string;
  name: string;
  username?: string;
  avatar?: string;
}

interface CreateGroupModalProps {
  contacts: Contact[];
  onClose: () => void;
  onGroupCreated: () => void;
}

export default function CreateGroupModal({ contacts, onClose, onGroupCreated }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedMembers.length < 2) {
      alert("Please add a group name and at least 2 members");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/chats/groups", {
        name: groupName.trim(),
        memberIds: selectedMembers
      });
      
      onGroupCreated();
      onClose();
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Create Group</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" title="Close">
            <X size={24} />
          </button>
        </div>

        {/* Group Name Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
          />
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
            />
            <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
          </div>
        </div>

        {/* Selected Members Count */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-300">
          {selectedMembers.length} member{selectedMembers.length !== 1 ? "s" : ""} selected
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map((contact) => (
            <div
              key={contact._id}
              onClick={() => toggleMember(contact._id)}
              className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <img
                  src={contact.avatar || `https://ui-avatars.com/api/?name=${contact.name}`}
                  alt={contact.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{contact.name}</p>
                  {contact.username && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{contact.username}</p>
                  )}
                </div>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedMembers.includes(contact._id)
                    ? "bg-whatsapp-green border-whatsapp-green"
                    : "border-gray-300 dark:border-gray-500"
                }`}
              >
                {selectedMembers.includes(contact._id) && (
                  <Check size={16} className="text-white" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCreate}
            disabled={loading || !groupName.trim() || selectedMembers.length < 2}
            className="w-full py-3 bg-whatsapp-green text-white rounded-lg font-semibold hover:bg-whatsapp-teal disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}
