"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await login({ username, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      alert("✅ Login successful");

      router.push("/chat"); // 🔁 Redirect to chat page
    } catch (err: any) {
      alert("❌ " + err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Login</h1>
      <input
        className="border p-2 mb-2 block"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        className="border p-2 mb-4 block"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin} className="bg-green-500 text-white px-4 py-2 rounded">
        Login
      </button>
    </div>
  );
}
