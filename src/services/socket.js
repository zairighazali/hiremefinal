import { io } from "socket.io-client";
import { auth } from "./firebase";

const SOCKET_URL = "https://hire-me-server-nine.vercel.app";

let socket = null;
let isInitializing = false;

export async function getSocket() {
  // If socket already exists and connected, return it
  if (socket && socket.connected) {
    return socket;
  }

  // If currently initializing, wait for it
  if (isInitializing) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (socket && socket.connected) {
          clearInterval(checkInterval);
          resolve(socket);
        }
      }, 100);
    });
  }

  // Initialize new connection
  isInitializing = true;

  try {
    if (!auth.currentUser) {
      throw new Error("User not logged in");
    }

    const token = await auth.currentUser.getIdToken(true);

    // Disconnect existing socket if any
    if (socket) {
      socket.disconnect();
    }

    socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Wait for connection
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Socket connection timeout"));
      }, 10000);

      socket.on("connect", () => {
        clearTimeout(timeout);
        console.log("Socket connected:", socket.id);
        resolve();
      });

      socket.on("connect_error", (error) => {
        clearTimeout(timeout);
        console.error("Socket connection error:", error);
        reject(error);
      });
    });

    // Setup reconnection handlers
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
    });

    socket.on("reconnect_error", (error) => {
      console.error("Socket reconnection error:", error);
    });

    socket.on("reconnect_failed", () => {
      console.error("Socket reconnection failed");
    });

    return socket;
  } catch (error) {
    console.error("Failed to initialize socket:", error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}