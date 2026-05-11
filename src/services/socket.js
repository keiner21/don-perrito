import { io } from "socket.io-client";

export const socket = io(
  "https://don-perrito-production.up.railway.app",
  {
    transports: [
      "websocket",
      "polling",
    ],

    secure: true,
  }
);
