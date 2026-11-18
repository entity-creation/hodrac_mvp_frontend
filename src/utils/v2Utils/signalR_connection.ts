// signalr/connection.ts
import { HubConnectionBuilder, LogLevel, type HubConnection } from "@microsoft/signalr";
import { API_BASE_URL, tokenStore } from "../../dataStore/v2Api/client";

// Same backend as the REST client.
const BASE_URL = API_BASE_URL;
// One connection per hub path, shared by every hook that uses it.
const hubConnections = new Map<string, Promise<HubConnection>>();

// Wishlist hub: anonymous connections may follow public templates; the token
// lets owners and collaborators join private wishlists.
export const connection = new HubConnectionBuilder()
  .withUrl(`${BASE_URL}/wishlistHub`, {
    accessTokenFactory: () => tokenStore.getAccess() ?? "",
  })
  .withAutomaticReconnect()
  .build();

// These hubs reject anonymous connections ([Authorize] on the server).
const SIGNED_IN_HUBS = new Set(["tripPostHub", "tripThreadHub", "notificationHub"]);

// Rejection used when a signed-in-only hub is requested while signed out.
export class SignedOutHubError extends Error {
  constructor(path: string) {
    super(`${path} needs a signed-in user`);
    this.name = "SignedOutHubError";
  }
}

// Logs a hub failure, except the expected "not signed in" case.
export const logHubError = (label: string, error: unknown) => {
  if (!(error instanceof SignedOutHubError)) console.error(label, error);
};

export const getHubConnection = (path: string): Promise<HubConnection> => {
  if (SIGNED_IN_HUBS.has(path) && !tokenStore.getAccess()) {
    return Promise.reject(new SignedOutHubError(path));
  }

  let pending = hubConnections.get(path);

  if (!pending) {
    const hub = new HubConnectionBuilder()
      .withUrl(`${BASE_URL}/${path}`, {
        accessTokenFactory: () => tokenStore.getAccess() ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    pending = hub.start().then(() => hub);

    // Drop a failed start so the next caller can retry.
    pending.catch(() => hubConnections.delete(path));

    hubConnections.set(path, pending);
  }

  return pending;
};

// Call on logout: the connections carry the old user's token, and the
// server routes Clients.User(...) events by that identity.
export const stopHubConnections = async () => {
  const pending = [...hubConnections.values()];
  hubConnections.clear();

  await Promise.all([
    ...pending.map((p) => p.then((hub) => hub.stop()).catch(() => {})),
    // Reconnects with the next user's token (or anonymously) when next used.
    connection.stop().catch(() => {}),
  ]);
};