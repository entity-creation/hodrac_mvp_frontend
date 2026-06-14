import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCollaborators, useUserWishlistDetail } from "../../../hooks/v2Hooks/useData";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import { Button, Skeleton, EmptyState } from "../../../components/v2Components/ui";
import type { CollaboratorDto } from "../../../types";

const ROLE_COLORS: Record<string, string> = {
  Owner:  "bg-gray-900 text-white",
  Editor: "bg-blue-100 text-blue-700",
  Viewer: "bg-gray-100 text-gray-600",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  Owner:  "Full access — can edit, delete, and manage collaborators",
  Editor: "Can edit itinerary, inclusions, and trip details",
  Viewer: "Can view the wishlist but cannot make changes",
};

function CollaboratorRow({
  collaborator,
  currentUserId,
  isOwner,
  onRemove,
  onChangeRole,
}: {
  collaborator: CollaboratorDto;
  currentUserId: string;
  isOwner: boolean;
  onRemove: () => void;
  onChangeRole: (role: string) => void;
}) {
  const [changingRole, setChangingRole] = useState(false);
  const [removing,     setRemoving]     = useState(false);
  const isSelf = collaborator.userId === currentUserId;

  const handleRemove = async () => {
    setRemoving(true);
    await onRemove();
    setRemoving(false);
  };

  const handleRole = async (role: string) => {
    setChangingRole(true);
    await onChangeRole(role);
    setChangingRole(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
        {collaborator.email.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {collaborator.email}
          {isSelf && <span className="ml-2 text-xs text-gray-400">(you)</span>}
        </p>
        <p className="text-xs text-gray-400">
          Joined {new Date(collaborator.joinedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Role badge / selector */}
      <div className="flex items-center gap-2 shrink-0">
        {isOwner && collaborator.role !== "Owner" ? (
          <select
            value={collaborator.role}
            onChange={e => handleRole(e.target.value)}
            disabled={changingRole}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 bg-white focus:outline-none focus:border-gray-900 transition cursor-pointer disabled:opacity-50"
          >
            <option value="Editor">Editor</option>
            <option value="Viewer">Viewer</option>
          </select>
        ) : (
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${ROLE_COLORS[collaborator.role] ?? "bg-gray-100 text-gray-600"}`}>
            {collaborator.role}
          </span>
        )}

        {/* Remove button (owner can remove others; anyone can remove themselves) */}
        {collaborator.role !== "Owner" && (isOwner || isSelf) && (
          <button
            onClick={handleRemove}
            disabled={removing}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors text-xs disabled:opacity-50"
          >
            ✕
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function CollaboratePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { data: wishlist, loading: wishlistLoading } = useUserWishlistDetail(id!);
  const { data: collaborators, loading, addCollaborator, removeCollaborator, changeRole } = useCollaborators(id!);

  const [email,  setEmail]  = useState("");
  const [role,   setRole]   = useState<"Editor" | "Viewer">("Editor");
  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState("");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState emoji="🔐" title="Sign in required" action={<Button onClick={() => navigate("/auth/login")}>Sign In</Button>} />
      </div>
    );
  }

  const isOwner    = wishlist?.userRole === "Owner";
  const currentUid = user?.userId ?? "";

  const handleAdd = async () => {
    if (!email.trim()) return;
    setAdding(true);
    setAddErr("");
    try {
      await addCollaborator(email.trim(), role);
      setEmail("");
    } catch (e: any) {
      setAddErr(e.message ?? "Could not add collaborator. Check the email and try again.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-5 md:px-8 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-900 transition-colors">
            ←
          </button>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Collaboration</p>
            <h1 className="text-xl font-black text-gray-900" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
              {wishlistLoading ? "Loading..." : wishlist?.wishlistName}
            </h1>
          </div>
        </div>

        {/* Role descriptions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Role permissions</p>
          <div className="flex flex-col gap-2">
            {Object.entries(ROLE_DESCRIPTIONS).map(([r, desc]) => (
              <div key={r} className="flex items-start gap-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${ROLE_COLORS[r]}`}>{r}</span>
                <p className="text-xs text-gray-500 pt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Add collaborator (owner only) */}
        {isOwner && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <p className="text-sm font-semibold text-gray-900 mb-4">Invite a collaborator</p>
            <div className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAdd()}
                placeholder="colleague@email.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-900 transition"
              />
              <div className="flex items-center gap-3">
                <div className="flex gap-2 flex-1">
                  {(["Editor", "Viewer"] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        role === r
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <Button onClick={handleAdd} loading={adding} size="md">
                  Invite
                </Button>
              </div>
              {addErr && <p className="text-xs text-red-500">{addErr}</p>}
            </div>
          </div>
        )}

        {/* Collaborator list */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">
            {loading ? "Loading..." : `${collaborators?.length ?? 0} collaborator${(collaborators?.length ?? 0) !== 1 ? "s" : ""}`}
          </p>

          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
            </div>
          ) : !collaborators?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">No collaborators yet.</p>
          ) : (
            <AnimatePresence>
              <div className="flex flex-col gap-3">
                {collaborators.map(c => (
                  <CollaboratorRow
                    key={c.userId}
                    collaborator={c}
                    currentUserId={currentUid}
                    isOwner={isOwner}
                    onRemove={() => removeCollaborator(c.userId)}
                    onChangeRole={(r) => changeRole(c.userId, r)}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>

        {/* Share link (informational) */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
          <p className="text-xs font-semibold text-blue-700 mb-1">💡 How collaboration works</p>
          <p className="text-xs text-blue-600 leading-relaxed">
            Editors can update the trip name, description, inclusions, and traveler count in real time.
            All changes are visible immediately to everyone with access.
            Only the owner can delete the wishlist or manage collaborators.
          </p>
        </div>
      </div>
    </div>
  );
}
