import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../utils/v2Utils/routes";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

// Shared shell for the Terms and Privacy pages: title, last-updated date,
// a contents list that links to each section, then the sections.
export default function LegalLayout({ title, updated, intro, sections }: {
  title: string;
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 pt-10 pb-24">
      <header className="max-w-3xl mb-10">
        <p className="text-[11px] uppercase tracking-[0.25em] text-ink-muted mb-4">Legal</p>
        <h1 className="text-4xl md:text-5xl font-light text-ink leading-[1.05]">{title}</h1>
        <p className="text-sm text-ink-muted mt-4">Last updated {updated}</p>
        <div className="mt-6 text-ink-soft leading-relaxed flex flex-col gap-3">{intro}</div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10">
        <nav aria-label="Contents" className="lg:sticky lg:top-24 self-start">
          <p className="text-xs font-medium uppercase tracking-widest text-ink-muted mb-3">Contents</p>
          <ol className="flex flex-col gap-2 text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-ink-soft hover:text-ink transition-colors">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="max-w-3xl flex flex-col gap-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-2xl font-light text-ink mb-4">{i + 1}. {s.title}</h2>
              <div className="flex flex-col gap-3 text-[15px] text-ink-soft leading-relaxed">{s.body}</div>
            </section>
          ))}

          <p className="text-sm text-ink-muted border-t border-line pt-6">
            See also our{" "}
            {title === "Terms of Service"
              ? <Link to={ROUTES.PUBLIC.PRIVACY} className="underline underline-offset-4 hover:text-ink">Privacy Policy</Link>
              : <Link to={ROUTES.PUBLIC.TERMS} className="underline underline-offset-4 hover:text-ink">Terms of Service</Link>}
            .
          </p>
        </div>
      </div>
    </div>
  );
}

// Small building blocks so the policy text stays readable.
export function List({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-5 flex flex-col gap-2 marker:text-ink-muted">{children}</ul>;
}

export function Term({ children }: { children: ReactNode }) {
  return <strong className="font-medium text-ink">{children}</strong>;
}

export function Mail() {
  return <a href="mailto:support@hodrac.com" className="underline underline-offset-4 text-ink">support@hodrac.com</a>;
}
