import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUserWishlistDetail } from "../../../hooks/v2Hooks/useData";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import { userWishlistsApi } from "../../../dataStore/v2Api/client";
import { Button, Skeleton, EmptyState } from "../../../components/v2Components/ui";

export default function EditWishlistPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: wishlist, loading, error } = useUserWishlistDetail(id!);

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

  // Populate form when wishlist loads
  useEffect(() => {
    if (!wishlist) return;
    setForm({
      wishlistName:          wishlist.wishlistName,
      wishlistDescription:   wishlist.wishlistDescription,
      shortStory:            wishlist.shortStory,
      defaultTravelersCount: wishlist.defaultTravelersCount,
      globalInclusions:      wishlist.globalInclusions ?? [],
    });
  }, [wishlist]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState emoji="🔐" title="Sign in required" action={<Button onClick={() => navigate("/auth/login")}>Sign In</Button>} />
      </div>
    );
  }

  if (loading) return <EditSkeleton />;
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
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      if (e.message?.includes("409") || e.message?.includes("concurren") || e.message?.includes("CONCURRENT")) {
        setSaveErr("Another collaborator saved changes at the same time. Refresh the page and reapply your changes.");
      } else {
        setSaveErr(e.message ?? "Save failed. Please try again.");
      }
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-5 md:px-8 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-900 transition-colors">
            ←
          </button>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Editing</p>
            <h1 className="text-xl font-black text-gray-900" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
              {wishlist.wishlistName}
            </h1>
          </div>
          {wishlist.userRole && (
            <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full ${
              wishlist.userRole === "Owner"  ? "bg-gray-900 text-white" :
              wishlist.userRole === "Editor" ? "bg-blue-100 text-blue-700" :
              "bg-gray-100 text-gray-500"
            }`}>
              {wishlist.userRole}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-6">

          {/* Name */}
          <Field label="Trip Name">
            <input
              type="text"
              value={form.wishlistName}
              onChange={e => setForm(f => ({ ...f, wishlistName: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-900 transition"
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-900 transition"
              placeholder="Step into the world you love — structured, immersive, affordable."
            />
            <p className="text-xs text-gray-400 mt-1">{form.shortStory.length}/120</p>
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              value={form.wishlistDescription}
              onChange={e => setForm(f => ({ ...f, wishlistDescription: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-900 transition resize-none"
              placeholder="Describe the experience, tone, and highlights of this trip..."
            />
          </Field>

          {/* Traveler count */}
          <Field label="Default Traveler Count">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setForm(f => ({ ...f, defaultTravelersCount: Math.max(1, f.defaultTravelersCount - 1) }))}
                className="w-10 h-10 rounded-full border-2 border-gray-200 text-gray-700 font-bold hover:border-gray-900 transition-colors"
              >−</button>
              <span className="text-lg font-black text-gray-900 w-8 text-center">{form.defaultTravelersCount}</span>
              <button
                onClick={() => setForm(f => ({ ...f, defaultTravelersCount: f.defaultTravelersCount + 1 }))}
                className="w-10 h-10 rounded-full border-2 border-gray-200 text-gray-700 font-bold hover:border-gray-900 transition-colors"
              >+</button>
            </div>
          </Field>

          {/* Inclusions */}
          <Field label="What's Included">
            <div className="flex flex-wrap gap-2 mb-3">
              {form.globalInclusions.map((inc, i) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-700">
                  ✓ {inc}
                  <button
                    onClick={() => removeInclusion(i)}
                    className="text-gray-400 hover:text-red-500 transition-colors leading-none"
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
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-900 transition"
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
            <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
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
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
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
