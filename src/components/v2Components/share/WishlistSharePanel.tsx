import { useState } from "react";
import { Copy, Check, Link2, Link2Off } from "lucide-react";
import { shareApi, userWishlistsApi } from "../../../dataStore/v2Api/client";
import { friendlyError } from "../../../utils/v2Utils/apiErrors";
import { Button } from "../ui";
import ShareButton from "./ShareButton";
import type { WishlistDetail } from "../../../types";

// Owner-only link sharing for a user's own wishlist. Creating a link is
// idempotent (same link each time); stopping revokes it immediately.
// Both count as an edit, so the caller should refetch (fresh xmin) afterwards.
export default function WishlistSharePanel({ wishlist, onChanged }: {
  wishlist: WishlistDetail;
  onChanged: () => void;
}) {
  const [link, setLink] = useState<{ token: string; url: string } | null>(
    wishlist.shareToken ? { token: wishlist.shareToken, url: wishlist.shareUrl ?? "" } : null
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmStop, setConfirmStop] = useState(false);
  const [copied, setCopied] = useState(false);

  const conflictMsg = "Someone was editing this wishlist at the same moment. Please try again.";

  const create = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await userWishlistsApi.share(wishlist.wishlistId);
      setLink({ token: res.shareToken, url: res.shareUrl });
      onChanged();
    } catch (e) {
      setError(friendlyError(e, { 409: conflictMsg, 404: "This wishlist no longer exists." }, "Couldn't create a share link."));
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    setBusy(true);
    setError("");
    try {
      await userWishlistsApi.unshare(wishlist.wishlistId);
      setLink(null);
      setConfirmStop(false);
      onChanged();
    } catch (e) {
      setError(friendlyError(e, { 409: conflictMsg }, "Couldn't turn off sharing."));
    } finally {
      setBusy(false);
    }
  };

  // Copy the preview link (proper card in chat apps), falling back to shareUrl.
  const copy = async () => {
    if (!link) return;
    let url = link.url;
    try {
      url = (await shareApi.info("shared-wishlist", link.token)).previewUrl || url;
    } catch { /* use shareUrl */ }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Couldn't copy. Select the link and copy it manually.");
    }
  };

  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-full bg-cream-deep flex items-center justify-center shrink-0">
          {link ? <Link2 className="w-4 h-4" /> : <Link2Off className="w-4 h-4 text-ink-muted" />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink">{link ? "Sharing is on" : "Share this wishlist"}</p>
          <p className="text-xs text-ink-muted mt-0.5">
            {link
              ? "Anyone with the link can see a read-only version. They can't edit it or see your collaborators."
              : "Only you and your collaborators can see it. Create a link to share a read-only version."}
          </p>
        </div>
      </div>

      {link ? (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              readOnly
              value={link.url}
              onFocus={e => e.currentTarget.select()}
              aria-label="Share link"
              className="flex-1 min-w-0 rounded-xl border border-line bg-cream-deep/60 px-3 py-2 text-sm text-ink"
            />
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ShareButton type="shared-wishlist" id={link.token} variant="button" label="Share…" />
            {confirmStop ? (
              <span className="flex items-center gap-2">
                <span className="text-sm text-ink-soft">The link stops working immediately.</span>
                <Button size="sm" variant="danger" loading={busy} onClick={stop}>Stop sharing</Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmStop(false)}>Cancel</Button>
              </span>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setConfirmStop(true)}>Stop sharing</Button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <Button variant="outline" loading={busy} onClick={create}>
            <Link2 className="w-4 h-4" /> Create share link
          </Button>
        </div>
      )}

      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </section>
  );
}
