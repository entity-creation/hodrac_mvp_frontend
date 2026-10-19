// signalr/connection.ts
import { HubConnectionBuilder, LogLevel, type HubConnection } from "@microsoft/signalr";
import { tokenStore } from "../../dataStore/v2Api/client";

const BASE_URL = "https://localhost:7116";
// One connection per hub path, shared by every hook that uses it.
const hubConnections = new Map<string, Promise<HubConnection>>();

export const connection = new HubConnectionBuilder()
  .withUrl(`${BASE_URL}/wishlistHub`)
  .withAutomaticReconnect()
  .build();

export const getHubConnection = (path: string): Promise<HubConnection> => {
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

  await Promise.all(
    pending.map((p) => p.then((hub) => hub.stop()).catch(() => {}))
  );
};