import { auth } from "../../firebase";

const API_BASE_URL = "https://hire-me-server-nine.vercel.app";

export async function authFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };

  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }

  const url = path.startsWith("/") ? API_BASE_URL + path : API_BASE_URL + "/" + path;

  console.log("[authFetch] URL:", url);
  console.log("[authFetch] Token exists?", !!auth.currentUser);
  console.log("[authFetch] Headers:", headers);

  return fetch(url, {
    ...options,
    headers,
  });
}

//"ministers-gardening-align-furnishings.trycloudflare.com"
//"https://41bbbbbf-93d5-4a52-aef1-e65635945258-00-3tcqp4xlzxntf.pike.replit.dev";