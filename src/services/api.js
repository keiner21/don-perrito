import axios from "axios";

export const api = axios.create({
  baseURL:
    "https://don-perrito-production.up.railway.app",
});
