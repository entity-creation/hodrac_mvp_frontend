// signalr/connection.ts
import * as signalR from "@microsoft/signalr";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://localhost:7116";

export const connection = new signalR.HubConnectionBuilder()
  .withUrl(`${BASE_URL}/wishlistHub`)
  .withAutomaticReconnect()
  .build();