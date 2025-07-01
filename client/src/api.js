
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// ✅ Attach accessToken and sharedToken to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("accessToken");
  const sharedToken = localStorage.getItem("sharedToken");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  if (sharedToken) {
    req.headers["x-shared-token"] = sharedToken;
  }

  return req;
});

export default API;
