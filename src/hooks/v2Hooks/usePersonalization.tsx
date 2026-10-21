import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
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

// The quiz can't be finished without its two single-choice answers; the
// landing page's interest chips save interests only, which doesn't count.
function isCompletedQuiz(p: PersonalizationData | null): p is PersonalizationData {
  return !!p?.travelGroup && !!p?.budget;
}

// Quiz answers → OnboardingRequest. The backend takes one string per field,
// so multi-choice questions send the first answer picked (all interests are
// also sent as tags via the interaction event).
function toOnboardingRequest(p: PersonalizationData) {
  return {
    whoTheyTravelWith: p.travelGroup || null,
    tripTypePreference: p.interests[0] ?? null,
    budgetProfile: p.budget || null,
    primaryPriority: p.priorities[0] ?? null,
  };
}

// App-wide "what kind of traveller are you" state. One quiz, available from
// anywhere (nav "For You", landing hero), remembered across visits.
export function PersonalizationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, updateUser } = useAuth();
  const [personalization, setPersonalization] = useState<PersonalizationData | null>(load);
  const [quizOpen, setQuizOpen] = useState(false);

  // Signed in but onboarding not recorded yet:
  //  - took the quiz as a guest → send those answers now (once per user);
  //  - otherwise nudge the quiz once.
  const synced = useRef<string | null>(null);
  useEffect(() => {
    if (!isAuthenticated || !user || user.hasCompletedOnboarding) return;

    if (isCompletedQuiz(personalization)) {
      if (synced.current === user.userId) return;
      synced.current = user.userId;
      authApi.completeOnboarding(toOnboardingRequest(personalization))
        .then(() => updateUser({ hasCompletedOnboarding: true }))
        .catch(() => { synced.current = null; });
      return;
    }

    if (!personalization) {
      const timer = setTimeout(() => setQuizOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, personalization, updateUser]);

  const update = useCallback((data: PersonalizationData | null) => {
    setPersonalization(data);
    persist(data);
  }, []);

  const handleComplete = useCallback(async (data: PersonalizationData) => {
    update(data);

    // Feeds the backend's tag inference loop.
    eventsApi.track("onboarding_completed", user?.userId ?? "anonymous", data.interests, "quiz");

    // Signed in: save the answers on the profile (also on retakes).
    // Guests: saved locally and sent when they sign in (effect above).
    if (isAuthenticated) {
      // Mark as handled so the sign-in sync effect doesn't send it a second time.
      if (user?.userId) synced.current = user.userId;
      await authApi.completeOnboarding(toOnboardingRequest(data)).catch(() => {});
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
