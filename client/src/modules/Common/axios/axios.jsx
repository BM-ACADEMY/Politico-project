// src/api/axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL, // your backend API
  withCredentials: true, // send cookies along with requests
  headers: {
    "Content-Type": "application/json"
  }
});
export default axiosInstance;
