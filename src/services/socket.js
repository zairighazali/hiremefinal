import { io } from "socket.io-client";
import { auth } from "./firebase";

const SOCKET_URL = "https://hire-me-server-nine.vercel.app";

let socket = null;
let isInitializing = false;
let connectionAttempts = 0;
const MAX_ATTEMPTS = 3;

export async function getSocket() {
  // If socket already exists and connected, return it
  if (socket && socket.connected) {
    return socket;
  }

  // If we've tried too many times, return null (graceful degradation)
  if (connectionAttempts >= MAX_ATTEMPTS) {
    console.warn('Socket connection failed after max attempts. Chat will work via Firebase only.');
    return null;
  }

  // If currently initializing, wait for it
  if (isInitializing) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!isInitializing) {
          clearInterval(checkInterval);
          resolve(socket && socket.connected ? socket : null);
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(null);
      }, 5000);
    });
  }

  // Initialize new connection
  isInitializing = true;
  connectionAttempts++;

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
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
    });

    // Wait for connection with timeout
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Socket connection timeout"));
      }, 10000);

      socket.on("connect", () => {
        clearTimeout(timeout);
        console.log("Socket connected:", socket.id);
        connectionAttempts = 0; // Reset on successful connection
        resolve();
      });

      socket.on("connect_error", (error) => {
        clearTimeout(timeout);
        console.error("Socket connection error:", error.message);
        reject(error);
      });
    });

    // Setup event handlers
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
      connectionAttempts = 0;
    });

    socket.on("reconnect_error", (error) => {
      console.error("Socket reconnection error:", error.message);
    });

    socket.on("reconnect_failed", () => {
      console.error("Socket reconnection failed");
    });

    return socket;
  } catch (error) {
    console.warn("Socket.io not available:", error.message);
    console.log("Chat will continue to work via Firebase Realtime Database");
    return null;
  } finally {
    isInitializing = false;
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  connectionAttempts = 0;
}