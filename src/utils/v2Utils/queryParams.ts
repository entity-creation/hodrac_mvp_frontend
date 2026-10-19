// Reads a query-string value without treating "+" as a space.
//
// URLSearchParams decodes "+" to " " (form encoding). Email links from the
// backend carry base64 tokens that can legitimately contain "+", so reading
// them through URLSearchParams would corrupt the token and the server would
// reject a valid link.
export function rawQueryParam(name: string, search = window.location.search): string | null {
  const query = search.startsWith("?") ? search.slice(1) : search;
  for (const part of query.split("&")) {
    const eq = part.indexOf("=");
    const key = eq === -1 ? part : part.slice(0, eq);
    if (safeDecode(key) !== name) continue;
    return eq === -1 ? "" : safeDecode(part.slice(eq + 1));
  }
  return null;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
