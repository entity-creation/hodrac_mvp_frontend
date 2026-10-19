import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../../../../hooks/v2Hooks/useAuth";
import { buttonClasses } from "../../ui";
import { registerPath } from "../../../../utils/v2Utils/authRedirect";
import { ROUTES } from "../../../../utils/v2Utils/routes";

const PERKS = [
  "Save the trips and places you love",
  "Follow itineraries and book with trusted partners",
  "Join trips and plan with your companions",
];

// Final nudge on the landing page: explore first, sign up once it's useful.
export default function SignupBand() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="bg-ink text-white">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-24 md:py-32 grid grid-cols-1 md:grid-cols-2 gap-14 items-end">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/50 mb-6">
            {isAuthenticated ? "Your next journey" : "Join Hodrac"}
          </p>
          <h2 className="text-4xl md:text-6xl font-light leading-[1.05]">
            {isAuthenticated
              ? `Where to next, ${user?.displayName?.split(" ")[0] ?? "traveller"}?`
              : "Keep everything you discover in one place."}
          </h2>
        </div>

        <div>
          <ul className="flex flex-col divide-y divide-white/10 border-y border-white/10 mb-10">
            {PERKS.map(p => (
              <li key={p} className="py-4 text-white/80">{p}</li>
            ))}
          </ul>
          {isAuthenticated ? (
            <button
              onClick={() => navigate(ROUTES.AUTH.CREATETRIPS)}
              className={buttonClasses("outline", "lg", "border-white/40! text-white! hover:bg-white! hover:text-ink!")}
            >
              Share a trip <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-6">
              <Link to={registerPath("/")} className={buttonClasses("outline", "lg", "bg-white! text-ink! border-white! hover:bg-cream!")}>
                Create a free account
              </Link>
              <Link to={ROUTES.PUBLIC.EXPLOREWISHLIST} className="text-sm text-white/70 hover:text-white underline underline-offset-4">
                Continue exploring
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
