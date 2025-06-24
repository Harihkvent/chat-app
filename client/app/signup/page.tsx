"use client";

import { useState } from "react";
import { signup } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    dob: "",
    gender: "Male",
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    phone: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const res = await signup(form);
      alert("✅ Signup success");
      router.push("/chat");
    } catch (err: any) {
      alert("❌ " + err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl mb-4">Sign Up</h1>
      {["name", "username", "email", "phone", "dob", "password", "confirmPassword"].map((field) => (
        <input
          key={field}
          name={field}
          type={field.includes("password") ? "password" : field === "dob" ? "date" : "text"}
          className="border p-2 mb-2 w-full"
          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
          value={form[field as keyof typeof form]}
          onChange={handleChange}
        />
      ))}
      <label htmlFor="gender" className="block mb-1">
        Gender
      </label>
      <select
        id="gender"
        name="gender"
        className="border p-2 mb-4 w-full"
        value={form.gender}
        onChange={handleChange}
      >
        <option>Male</option>
        <option>Female</option>
        <option>Other</option>
      </select>
      <button onClick={handleSignup} className="bg-blue-600 text-white px-4 py-2 rounded">
        Sign Up
      </button>
    </div>
  );
}
