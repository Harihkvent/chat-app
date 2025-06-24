"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import socket from "@/lib/socket";

interface Contact {
  _id: string;
  username: string;
  name: string;
}

interface ChatMessage {
  to: string; // username
  message: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);

  // Fetch contacts
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("http://localhost:4000/api/users/contacts", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setContacts(data);
        if (data.length > 0) setActiveContact(data[0]);
      })
      .catch((err) => {
        console.error("Failed to fetch contacts:", err);
        alert("Session expired. Please login again.");
        logout();
      });
  }, []);

  // Listen for messages
  useEffect(() => {
    const handleReceiveMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };
    socket.on("receiveMessage", handleReceiveMessage);
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() && activeContact) {
      const payload: ChatMessage = {
        to: activeContact.username,
        message,
      };
      socket.emit("sendMessage", payload);
      setMessages((prev) => [...prev, payload]);
      setMessage("");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-200 p-4">
        <h2 className="text-xl font-bold mb-4">Contacts</h2>
        <ul>
          {contacts.map((c) => (
            <li
              key={c._id}
              onClick={() => setActiveContact(c)}
              className={`p-2 cursor-pointer rounded ${
                activeContact?._id === c._id
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-300"
              }`}
            >
              {c.name} ({c.username})
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {activeContact
              ? `Chat with ${activeContact.name} (${activeContact.username})`
              : "No contact selected"}
          </h2>
          <button onClick={logout} className="bg-red-500 px-4 py-1 rounded">
            Logout
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {messages.map((msg, i) => (
            <div key={i} className="mb-2 p-2 bg-white rounded shadow">
              <strong>To {msg.to}:</strong> {msg.message}
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t">
          <input
            className="border p-2 w-full mb-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
