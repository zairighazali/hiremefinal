import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";

// upload file ke path tertentu, return URL
export async function uploadFile(file, path) {
  if (!file) throw new Error("No file provided");

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);

  const url = await getDownloadURL(storageRef);
  return url;
}