import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from "react";
import { useAuth } from "./useAuth";
import { authApi, eventsApi } from "../../dataStore/v2Api/client";
import PersonalizationModal from "../../components/v2Components/pages/landingPage2/PersonalizationModal";

export interface PersonalizationData {
  travelGroup: string;
  interests: string[];
  budget: string;
  priorities: string[];
}

interface PersonalizationContextValue {
  personalization: PersonalizationData | null;
  // Vibe tags derived from the quiz, in the format wishlistsApi.list expects.
  vibeTags: string[];
  setVibeTags: (tags: string[]) => void;
  openQuiz: () => void;
  clear: () => void;
}

const STORAGE_KEY = "hodrac_personalization";

function load(): PersonalizationData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersonalizationData) : null;
  } catch {
    return null;
  }
}

function persist(data: PersonalizationData | null) {
  try {
    if (data) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode) — keep it in memory only.
  }
}

const PersonalizationContext = createContext<PersonalizationContextValue | null>(null);

// App-wide "what kind of traveller are you" state. One quiz, available from
// anywhere (nav "For You", landing hero), remembered across visits.
export function PersonalizationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, updateUser } = useAuth();
  const [personalization, setPersonalization] = useState<PersonalizationData | null>(load);
  const [quizOpen, setQuizOpen] = useState(false);

  // First visit after sign-up: nudge the quiz once if we know nothing yet.
  useEffect(() => {
    if (isAuthenticated && user && !user.hasCompletedOnboarding && !personalization) {
      const timer = setTimeout(() => setQuizOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, personalization]);

  const update = useCallback((data: PersonalizationData | null) => {
    setPersonalization(data);
    persist(data);
  }, []);

  const handleComplete = useCallback(async (data: PersonalizationData) => {
    update(data);

    // Feeds the backend's tag inference loop.
    eventsApi.track("onboarding_completed", user?.userId ?? "anonymous", data.interests, "quiz");

    if (isAuthenticated) {
      await authApi.completeOnboarding().catch(() => {});
      updateUser({ hasCompletedOnboarding: true });
    }
  }, [update, user?.userId, isAuthenticated, updateUser]);

  const setVibeTags = useCallback((tags: string[]) => {
    update({
      travelGroup: personalization?.travelGroup ?? "",
      budget: personalization?.budget ?? "",
      priorities: personalization?.priorities ?? [],
      interests: tags,
    });
  }, [personalization, update]);

  const value = useMemo<PersonalizationContextValue>(() => ({
    personalization,
    vibeTags: personalization?.interests ?? [],
    setVibeTags,
    openQuiz: () => setQuizOpen(true),
    clear: () => update(null),
  }), [personalization, setVibeTags, update]);

  return (
    <PersonalizationContext.Provider value={value}>
      {children}
      <PersonalizationModal
        isOpen={quizOpen}
        onClose={() => setQuizOpen(false)}
        onComplete={handleComplete}
      />
    </PersonalizationContext.Provider>
  );
}

export function usePersonalization() {
  const ctx = useContext(PersonalizationContext);
  if (!ctx) throw new Error("usePersonalization must be used inside PersonalizationProvider");
  return ctx;
}
