"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import styles from "./page.module.css";
import Button from '../components/Button';
import Welcome from '../components/Welcome';
export default function Home() {
  const [count, setCount] = useState(0);

  const [health, setHealth] = useState("loading...");

  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/api/health`)
      .then((res) => setHealth(res.data.status))
      .catch(() => setHealth("error"));
  }, []);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Hello, ChatApp!</h1>
      <Welcome name="User" />
      <p>You clicked {count} times.</p>
      <Button label="Click Me" onClick={() => setCount(count + 1)} />
      <p>Server health: <strong>{health}</strong></p>

    </main>
  );
}
