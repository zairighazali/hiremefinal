import { io } from "socket.io-client";
import { auth } from "../../firebase";

const SOCKET_URL = "https://41bbbbbf-93d5-4a52-aef1-e65635945258-00-3tcqp4xlzxntf.pike.replit.dev";

let socket;

export async function initSocket() {
  if (!auth.currentUser) throw new Error("User not logged in");

  const token = await auth.currentUser.getIdToken(true);

  socket = io(SOCKET_URL, {
    auth: {
      token, // hanya token, jangan hantar UID client
    },
    autoConnect: true,
  });

  // optional: log connect/disconnect
  socket.on("connect", () => console.log("Socket connected:", socket.id));
  socket.on("disconnect", (reason) => console.log("Socket disconnected:", reason));

  return socket;
}

export function getSocket() {
  if (!socket) throw new Error("Socket not initialized. Call initSocket()");
  return socket;
}
