import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  withCredentials: true, // for cookies, if needed in future
});

export const signup = (data: { username: string; password: string }) =>
  API.post("/api/auth/signup", data);

export const login = (data: { username: string; password: string }) =>
  API.post("/api/auth/login", data);

export const getProtected = (token: string) =>
  API.get("/api/protected", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
