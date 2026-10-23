import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUserWishlistDetail } from "../../../hooks/v2Hooks/useData";
import { userWishlistsApi } from "../../../dataStore/v2Api/client";
import { friendlyError } from "../../../utils/v2Utils/apiErrors";
import { Button, Skeleton, EmptyState } from "../../../components/v2Components/ui";
import WishlistSharePanel from "../../../components/v2Components/share/WishlistSharePanel";

export default function EditWishlistPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: wishlist, loading, error, refetch } = useUserWishlistDetail(id!);

  const [form, setForm] = useState({
    wishlistName:        "",
    wishlistDescription: "",
    shortStory:          "",
    defaultTravelersCount: 2,
    globalInclusions:    [] as string[],
  });
  const [newInclusion, setNewInclusion] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [saved,   setSaved]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fill the form once per wishlist. Later refetches (to pick up a fresh xmin
  // after saving or toggling sharing) must not overwrite unsaved edits.
  const filledFor = useRef<string | null>(null);
  useEffect(() => {
    if (!wishlist || filledFor.current === wishlist.wishlistId) return;
    filledFor.current = wishlist.wishlistId;
    setForm({
      wishlistName:          wishlist.wishlistName,
      wishlistDescription:   wishlist.wishlistDescription,
      shortStory:            wishlist.shortStory,
      defaultTravelersCount: wishlist.defaultTravelersCount,
      globalInclusions:      wishlist.globalInclusions ?? [],
    });
  }, [wishlist]);

  // Show the skeleton only on first load, not during background refetches.
  if (loading && !wishlist) return <EditSkeleton />;
  if (error || !wishlist) return (
    <div className="min-h-screen flex items-center justify-center">
      <EmptyState emoji="😕" title="Wishlist not found" action={<Button onClick={() => navigate(-1)}>Go back</Button>} />
    </div>
  );

  if (wishlist.userRole === "Viewer") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState emoji="👁️" title="View only" subtitle="You have Viewer access. Ask the owner for Editor rights to make changes." action={<Button onClick={() => navigate(-1)}>Go back</Button>} />
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setSaveErr("");
    setSaved(false);
    try {
      // Pass xmin so the server can detect concurrent edits via PostgreSQL's
      // xmin system column. If another collaborator saved between our GET and
      // this PUT, the server returns 409 and we show a clear message.
      await userWishlistsApi.update(id!, { ...form, xmin: wishlist?.xmin });
      // The save changed xmin on the server; fetch it so the next save doesn't
      // report a false edit conflict.
      refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setSaveErr(friendlyError(e, {
        409: "Someone else saved changes to this wishlist since you opened it. Refresh the page and reapply your changes.",
        404: "This wishlist no longer exists.",
      }, "Save failed. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await userWishlistsApi.delete(id!);
      navigate("/my-wishlists");
    } catch (e: any) {
      setSaveErr(e.message ?? "Delete failed.");
      setDeleting(false);
    }
  };

  const addInclusion = () => {
    if (!newInclusion.trim()) return;
    setForm(f => ({ ...f, globalInclusions: [...f.globalInclusions, newInclusion.trim()] }));
    setNewInclusion("");
  };

  const removeInclusion = (i: number) => {
    setForm(f => ({ ...f, globalInclusions: f.globalInclusions.filter((_, idx) => idx !== i) }));
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-5 md:px-8 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white border border-line flex items-center justify-center text-ink-soft hover:border-ink transition-colors">
            ←
          </button>
          <div>
            <p className="text-xs text-ink-muted uppercase tracking-wide">Editing</p>
            <h1 className="font-display text-xl font-normal text-ink">
              {wishlist.wishlistName}
            </h1>
          </div>
          {wishlist.userRole && (
            <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full ${
              wishlist.userRole === "Owner"  ? "bg-ink text-white" :
              wishlist.userRole === "Editor" ? "bg-sky-500 text-ink" :
              "bg-cream-deep text-ink-soft"
            }`}>
              {wishlist.userRole}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-6">

          {(wishlist.isUserOwner || wishlist.userRole === "Owner") && (
            <WishlistSharePanel wishlist={wishlist} onChanged={refetch} />
          )}

          {/* Name */}
          <Field label="Trip Name">
            <input
              type="text"
              value={form.wishlistName}
              onChange={e => setForm(f => ({ ...f, wishlistName: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-line text-sm bg-white focus:outline-none focus:border-ink transition"
              placeholder="5-Day Tokyo Anime Escape"
            />
          </Field>

          {/* Short story */}
          <Field label="Hook / Short Story" hint="Shown on cards — keep it evocative, max 120 chars">
            <input
              type="text"
              value={form.shortStory}
              onChange={e => setForm(f => ({ ...f, shortStory: e.target.value }))}
              maxLength={120}
              className="w-full px-4 py-3 rounded-xl border border-line text-sm bg-white focus:outline-none focus:border-ink transition"
              placeholder="Step into the world you love — structured, immersive, affordable."
            />
            <p className="text-xs text-ink-muted mt-1">{form.shortStory.length}/120</p>
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              value={form.wishlistDescription}
              onChange={e => setForm(f => ({ ...f, wishlistDescription: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-line text-sm bg-white focus:outline-none focus:border-ink transition resize-none"
              placeholder="Describe the experience, tone, and highlights of this trip..."
            />
          </Field>

          {/* Traveler count */}
          <Field label="Default Traveler Count">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setForm(f => ({ ...f, defaultTravelersCount: Math.max(1, f.defaultTravelersCount - 1) }))}
                className="w-10 h-10 rounded-full border border-line text-ink font-medium hover:border-ink transition-colors"
              >−</button>
              <span className="text-lg font-semibold text-ink w-8 text-center">{form.defaultTravelersCount}</span>
              <button
                onClick={() => setForm(f => ({ ...f, defaultTravelersCount: f.defaultTravelersCount + 1 }))}
                className="w-10 h-10 rounded-full border border-line text-ink font-medium hover:border-ink transition-colors"
              >+</button>
            </div>
          </Field>

          {/* Inclusions */}
          <Field label="What's Included">
            <div className="flex flex-wrap gap-2 mb-3">
              {form.globalInclusions.map((inc, i) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-cream-deep rounded-full text-xs text-ink">
                  ✓ {inc}
                  <button
                    onClick={() => removeInclusion(i)}
                    className="text-ink-muted hover:text-red-500 transition-colors leading-none"
                  >✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newInclusion}
                onChange={e => setNewInclusion(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addInclusion())}
                placeholder="e.g. Boutique Hotels, Shinkansen Pass..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-line text-sm bg-white focus:outline-none focus:border-ink transition"
              />
              <Button onClick={addInclusion} variant="outline" size="sm">Add</Button>
            </div>
          </Field>

          {/* Error / success */}
          {saveErr && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {saveErr}
            </div>
          )}
          {saved && (
            <div className="px-4 py-3 bg-mint-100 border border-mint-500 rounded-xl text-sm text-mint-500">
              ✓ Changes saved successfully.
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Button onClick={handleSave} loading={saving} fullWidth>
              Save changes
            </Button>
            <Button
              onClick={() => navigate(`/my-wishlists/${id}/collaborate`)}
              variant="outline"
              fullWidth
            >
              👥 Manage collaborators
            </Button>

            {wishlist.isUserOwner && (
              <>
                {!showDeleteConfirm ? (
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="ghost"
                    fullWidth
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete this wishlist
                  </Button>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col gap-3">
                    <p className="text-sm text-red-700 font-medium">
                      Are you sure? This cannot be undone.
                    </p>
                    <div className="flex gap-3">
                      <Button onClick={handleDelete} variant="danger" loading={deleting} size="sm">
                        Yes, delete
                      </Button>
                      <Button onClick={() => setShowDeleteConfirm(false)} variant="ghost" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-ink">{label}</label>
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
      {children}
    </div>
  );
}

function EditSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-10 flex flex-col gap-5">
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
    </div>
  );
}
