import { useMemo, useState } from "react";
import { Check, Globe, Search } from "lucide-react";
import { Modal } from "../ui";
import { useCurrency } from "../../../hooks/v2Hooks/useCurrency";
import { countryName, countryOptions, flagEmoji } from "../../../utils/v2Utils/countries";
import { friendlyError } from "../../../utils/v2Utils/apiErrors";

// Searchable country list. Selecting a country sets the display currency.
export function CountryList({ onChosen }: { onChosen?: () => void }) {
  const { country, setCountry } = useCurrency();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const all = useMemo(() => countryOptions(), []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? all.filter(c => c.name.toLowerCase().includes(q) || c.currency.toLowerCase().includes(q) || c.code.toLowerCase() === q)
    : all;

  const choose = async (code: string) => {
    setError("");
    try {
      await setCountry(code);
      onChosen?.();
    } catch (e) {
      setError(friendlyError(e, {}, "Couldn't save your country. It's applied on this device for now."));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search country or currency"
          aria-label="Search country or currency"
          className="w-full rounded-xl border border-line bg-white pl-10 pr-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink"
        />
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <ul role="listbox" aria-label="Countries" className="max-h-80 overflow-y-auto -mx-2">
        {filtered.map(c => {
          const selected = c.code === country;
          return (
            <li key={c.code} role="option" aria-selected={selected}>
              <button
                type="button"
                onClick={() => choose(c.code)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${selected ? "bg-cream-deep" : "hover:bg-cream-deep"}`}
              >
                <span className="text-lg leading-none" aria-hidden="true">{flagEmoji(c.code)}</span>
                <span className="flex-1 min-w-0 text-sm text-ink truncate">{c.name}</span>
                <span className="text-xs text-ink-muted">{c.currency}</span>
                {selected && <Check className="w-4 h-4 text-ink shrink-0" />}
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && <li className="px-3 py-6 text-sm text-ink-muted text-center">No matches.</li>}
      </ul>
    </div>
  );
}

// Navbar control showing the current currency; opens the country list.
export function CurrencyButton({ className = "" }: { className?: string }) {
  const { country, preferredCurrency } = useCurrency();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Country and currency: ${countryName(country)}, ${preferredCurrency}`}
        className={`h-10 inline-flex items-center gap-1.5 rounded-full border border-line bg-white/70 px-3 text-xs font-medium text-ink hover:border-ink transition-colors ${className}`}
      >
        <Globe className="w-4 h-4" strokeWidth={1.5} />
        {preferredCurrency}
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} label="Country and currency">
        <div className="p-6 md:p-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-ink-muted mb-2">Country & currency</p>
          <h2 className="text-2xl font-light text-ink mb-1 pr-10">Where are you based?</h2>
          <p className="text-sm text-ink-muted mb-5">Prices are converted to your local currency at today's rate.</p>
          <CountryList onChosen={() => setOpen(false)} />
        </div>
      </Modal>
    </>
  );
}
