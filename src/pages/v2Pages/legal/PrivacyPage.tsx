import { Link } from "react-router-dom";
import { ROUTES } from "../../../utils/v2Utils/routes";
import LegalLayout, { List, Mail, Term, type LegalSection } from "./LegalLayout";

const UPDATED = "30 October 2026";

const ext = "underline underline-offset-4 text-ink";

const sections: LegalSection[] = [
  {
    id: "controller",
    title: "Who is responsible for your data",
    body: <>
      <p>
        Hodrac is owned and operated by <Term>Ionva Limited</Term>, a technology company incorporated in Nigeria
        ("Ionva", "we", "us"). Ionva is the data controller for the personal data described in this policy.
      </p>
      <p>
        We process personal data in line with the <Term>Nigeria Data Protection Act 2023</Term> (NDPA) and, where it
        applies to you, other data protection laws such as the EU and UK General Data Protection Regulation (GDPR).
      </p>
      <p>For any privacy question or request, contact us at <Mail />.</p>
    </>,
  },
  {
    id: "collect",
    title: "What we collect",
    body: <>
      <p><Term>Information you give us</Term></p>
      <List>
        <li><Term>Account details:</Term> your name, email address and password (stored only in hashed form), and optionally a profile picture.</li>
        <li><Term>Country:</Term> your home country, used to show prices in your currency.</li>
        <li>
          <Term>Travel preferences:</Term> your answers to the short quiz (who you travel with, what excites you, how you
          like to spend, what matters most).
        </li>
        <li>
          <Term>Your content:</Term> wishlists you create or edit, collaborators you invite, trips you post, requests to
          join trips, and messages you send in trip threads.
        </li>
        <li><Term>Communication choices:</Term> whether you want email notifications, and newsletter sign-ups.</li>
        <li>
          <Term>Messages to us:</Term> what you send through the contact form, or, for businesses, the partner enquiry
          form (company name, contact name, email, website and message).
        </li>
      </List>

      <p className="mt-2"><Term>Information collected as you use Hodrac</Term></p>
      <List>
        <li>
          <Term>Activity:</Term> the destinations and wishlists you view and save, searches, and when you start or
          finish the quiz.
        </li>
        <li>
          <Term>Partner clicks:</Term> when you select a Partner's booking button, we record the click, the page it came
          from, the time, your account (if you are signed in), and basic technical details such as browser type, the
          referring page and whether the visit looks automated.
        </li>
        <li>
          <Term>Usage and device data:</Term> how you move around and interact with pages, device and browser type,
          screen size, approximate location derived from your IP address, and pages visited. Much of this is collected
          with Microsoft Clarity (see section 7).
        </li>
      </List>

      <p className="mt-2"><Term>Information we work out</Term></p>
      <List>
        <li>
          <Term>Travel profile:</Term> from your quiz answers and activity we estimate a traveller type, a budget style,
          an approximate spending bracket and travel-personality scores (for example how adventurous or social your choices
          are). See section 4.
        </li>
      </List>

      <p className="mt-2">
        We do not ask for, and ask you not to share, sensitive data such as health information, religious beliefs or
        government ID numbers. Please don't include it in messages or trip posts.
      </p>
    </>,
  },
  {
    id: "use",
    title: "How we use it, and our legal basis",
    body: <>
      <List>
        <li>
          <Term>To run your account and the features you use</Term>: sign-in, saving and sharing wishlists, collaborators,
          trip posts, trip threads and notifications. <em>Basis: performing our contract with you.</em>
        </li>
        <li>
          <Term>To personalise Hodrac</Term>: recommending wishlists, destinations and trips that suit your travel profile,
          and showing prices in your currency. <em>Basis: our legitimate interest in providing relevant recommendations, and
          your consent where you choose to answer the quiz.</em>
        </li>
        <li>
          <Term>To work with Partners</Term>: showing relevant Partner offers, recording booking clicks, and reporting to
          Partners on how their listings perform. <em>Basis: our legitimate interest in funding Hodrac through Partners.</em>
        </li>
        <li>
          <Term>To understand and improve Hodrac</Term>: analytics, session replays and aggregated audience insights.
          <em> Basis: our legitimate interest in improving the Service.</em>
        </li>
        <li>
          <Term>To email you</Term>: account emails (confirmation, password reset, security) and, if you opt in,
          notifications and newsletters. <em>Basis: contract for account emails; consent for optional emails, which you can
          withdraw at any time.</em>
        </li>
        <li>
          <Term>To keep Hodrac safe</Term>: preventing fraud, spam, bot traffic and abuse, enforcing our{" "}
          <Link to={ROUTES.PUBLIC.TERMS} className={ext}>Terms</Link>, and responding to reports.
          <em> Basis: legitimate interests and legal obligations.</em>
        </li>
        <li>
          <Term>To meet legal obligations</Term>, for example responding to lawful requests from authorities.
        </li>
      </List>
    </>,
  },
  {
    id: "profiling",
    title: "Personalisation and profiling",
    body: <>
      <p>
        Hodrac's core feature is matching you with trips that fit you. To do this we automatically build a travel profile
        from your quiz answers and what you view and save. It decides what we recommend first and which Partner offers you
        see. It is never used to make decisions with legal or similarly significant effects on you, such as approving or
        refusing you for anything.
      </p>
      <p>
        You can skip the quiz, change your answers, or ask us at <Mail /> to stop using your activity for personalisation.
        Recommendations will then be more general.
      </p>
    </>,
  },
  {
    id: "share",
    title: "Who we share it with",
    body: <>
      <p><Term>We do not sell your personal data.</Term> We share it only as follows:</p>
      <List>
        <li>
          <Term>Other users</Term> see what you choose to make visible: your display name and picture, trips you post,
          requests to join trips, messages in trip threads, and wishlists you share with collaborators. Anyone with a
          wishlist share link can view that wishlist until you turn sharing off.
        </li>
        <li>
          <Term>Partners</Term>: when you select a booking button you go to the Partner's website, which may be able to see
          that you came from Hodrac (for example through tags added to the link) and will collect data under its own
          privacy policy. We share click and audience statistics with Partners only in aggregated form that does not
          identify you. Groups smaller than three people are combined so no individual stands out.
        </li>
        <li>
          <Term>Service providers</Term> who process data for us under contract, including hosting and databases
          (e.g. Render), email delivery, Microsoft Clarity for analytics, and EmailJS for our contact form.
        </li>
        <li>
          <Term>Authorities or others</Term> where required by law, or to protect the rights, property or safety of our
          users, the public or Ionva.
        </li>
        <li>
          <Term>A buyer or successor</Term> if Ionva or Hodrac is involved in a merger, acquisition or sale of assets, in
          which case this policy will continue to protect your data.
        </li>
      </List>
    </>,
  },
  {
    id: "transfers",
    title: "International transfers",
    body: <>
      <p>
        Some of our service providers store or process data outside Nigeria, for example in the United States or the
        European Union. Where we transfer personal data abroad, we rely on safeguards recognised by the NDPA, such as
        the receiving country's adequate level of protection, contractual protections, or your consent.
      </p>
    </>,
  },
  {
    id: "cookies",
    title: "Cookies, local storage and Microsoft Clarity",
    body: <>
      <p><Term>Essential storage.</Term> We use your browser's local storage to keep you signed in (login tokens), and to
        remember settings such as your currency. Hodrac does not work properly without it.</p>
      <p>
        <Term>Microsoft Clarity.</Term> We use Microsoft Clarity to understand how people use Hodrac through heatmaps,
        session replays and usage statistics. Clarity records interactions such as clicks, scrolling and mouse movement,
        along with device and browser details and approximate location. Clarity masks text typed into form fields by
        default, so we do not intend it to capture passwords or other details you enter. Microsoft may use this data as
        described in the{" "}
        <a href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noopener noreferrer" className={ext}>
          Microsoft Privacy Statement
        </a>.
      </p>
      <p>Clarity sets cookies including:</p>
      <List>
        <li><code>_clck</code>: identifies a returning visitor (up to 1 year).</li>
        <li><code>_clsk</code>: groups page views into one session (1 day).</li>
        <li><code>CLID</code>, <code>MUID</code>: identify a browser across sites that use Clarity (up to 1 year).</li>
        <li><code>ANONCHK</code>, <code>SM</code>, <code>MR</code>: short-lived technical cookies set by Microsoft.</li>
      </List>
      <p>
        You can block or delete these cookies in your browser settings, or use a privacy extension that blocks
        analytics scripts. Hodrac will keep working if you do.
      </p>
    </>,
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: <>
      <List>
        <li>Account data and your content: while your account is open. When you delete your account, we delete or anonymise it within 30 days, except as below.</li>
        <li>Messages already sent in shared trip threads may remain visible to other members, shown without your profile.</li>
        <li>Activity and partner click records: as long as needed for recommendations and partner reporting, then deleted or anonymised. Aggregated statistics that don't identify you may be kept.</li>
        <li>Booking links include a personal tracking token that expires after 7 days.</li>
        <li>Clarity data is kept by Microsoft in line with Clarity's retention settings.</li>
        <li>Some records may be kept longer where the law requires it or to resolve disputes.</li>
      </List>
    </>,
  },
  {
    id: "rights",
    title: "Your rights",
    body: <>
      <p>Subject to the law, you have the right to:</p>
      <List>
        <li>be informed about how we use your data (this policy);</li>
        <li>access a copy of your personal data;</li>
        <li>correct inaccurate or incomplete data. You can update most details yourself on your <Link to={ROUTES.AUTH.ACCOUNT} className={ext}>account page</Link>;</li>
        <li>have your data deleted;</li>
        <li>restrict or object to processing, including personalisation and profiling;</li>
        <li>receive your data in a portable format;</li>
        <li>withdraw consent at any time, for example by turning off email notifications, without affecting earlier processing.</li>
      </List>
      <p>
        To use any of these rights, email <Mail /> from the address on your account. We may need to confirm your
        identity, and we aim to respond within 30 days.
      </p>
      <p>
        If you are unhappy with how we handle your data, you can complain to the{" "}
        <a href="https://ndpc.gov.ng" target="_blank" rel="noopener noreferrer" className={ext}>Nigeria Data Protection Commission</a>,
        or to your local data protection authority if you live elsewhere. We'd appreciate the chance to resolve it first.
      </p>
    </>,
  },
  {
    id: "security",
    title: "Security",
    body: <>
      <p>
        We use technical and organisational measures to protect your data, including encrypted connections (HTTPS),
        hashed passwords and restricted staff access. No system is completely secure, so please use a strong, unique
        password and tell us at <Mail /> if you think your account has been compromised. If a breach puts your rights at
        risk, we will notify you and the regulator as the law requires.
      </p>
    </>,
  },
  {
    id: "children",
    title: "Children",
    body: <>
      <p>
        Hodrac is only for people aged 18 and over. We do not knowingly collect data from anyone under 18. If you
        believe a child has given us personal data, contact <Mail /> and we will delete it.
      </p>
    </>,
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: <>
      <p>
        We may update this policy as Hodrac changes. We will update the date at the top and, for significant changes,
        tell you by email or in the app before they take effect.
      </p>
    </>,
  },
  {
    id: "contact",
    title: "Contact us",
    body: <>
      <p>Ionva Limited, Nigeria · <Mail /></p>
    </>,
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      updated={UPDATED}
      intro={<>
        <p>
          This policy explains what personal data Hodrac collects, why, who we share it with, and the choices you have.
        </p>
        <p>
          In short: we use your quiz answers and activity to recommend trips that suit you. We don't sell your data. We
          use Microsoft Clarity to understand how the site is used. Partners only get statistics that can't identify you.
        </p>
      </>}
      sections={sections}
    />
  );
}
