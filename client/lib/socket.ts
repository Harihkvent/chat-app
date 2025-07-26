import { io } from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000");

export default socket;
