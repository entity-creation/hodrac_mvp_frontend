import type { ClientDescription } from "../models/description_client";

export function convertJsonToDescription(
  json: string,
): ClientDescription | null {
  try {
    const result = JSON.parse(json) as ClientDescription;
    return result;
  } catch (ex) {
    console.log(ex);
    return null;
  }
}
