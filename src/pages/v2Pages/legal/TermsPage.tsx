import { Link } from "react-router-dom";
import { ROUTES } from "../../../utils/v2Utils/routes";
import LegalLayout, { List, Mail, Term, type LegalSection } from "./LegalLayout";

const UPDATED = "30 October 2026";

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: <>
      <p>
        Hodrac (the website at hodrac.com and any related apps and services, together the "Service") is owned and
        operated by <Term>Ionva Limited</Term>, a private company limited by shares incorporated in the Federal Republic
        of Nigeria under the Companies and Allied Matters Act 2020 ("Ionva", "we", "us" or "our").
      </p>
      <p>You can contact us at <Mail />.</p>
    </>,
  },
  {
    id: "agreement",
    title: "Agreeing to these terms",
    body: <>
      <p>
        By creating an account or using the Service you agree to these Terms of Service and confirm that you have read
        our <Link to={ROUTES.PUBLIC.PRIVACY} className="underline underline-offset-4 text-ink">Privacy Policy</Link>.
        If you do not agree, please do not use the Service.
      </p>
      <p>
        You can browse public pages without an account. These terms still apply to that use.
      </p>
    </>,
  },
  {
    id: "eligibility",
    title: "Who can use Hodrac",
    body: <>
      <p>
        You must be <Term>at least 18 years old</Term> to create an account or use the trip-matching and messaging
        features. By using the Service you confirm that you are 18 or older and able to enter into a binding contract.
      </p>
      <p>We may close any account we reasonably believe belongs to someone under 18.</p>
    </>,
  },
  {
    id: "service",
    title: "What Hodrac does (and doesn't do)",
    body: <>
      <p>Hodrac is a travel discovery and planning platform. It helps you:</p>
      <List>
        <li>discover destinations and ready-made trip ideas ("wishlists") suited to you;</li>
        <li>save, create, edit and share your own wishlists and invite collaborators;</li>
        <li>post trips and find other travellers to go with, and talk to them in trip threads;</li>
        <li>reach third-party travel providers ("Partners") through booking links.</li>
      </List>
      <p>
        <Term>Hodrac is not a travel agent, tour operator or booking platform.</Term> We do not sell, arrange or
        provide flights, accommodation, tours or other travel services, and we are not a party to any agreement you make
        with a Partner or with another user.
      </p>
      <p>
        Itineraries, prices, costs and other information on Hodrac are for inspiration and planning only. They may be
        estimates, may change, and may not be accurate or complete. Prices shown in your local currency are converted
        from US dollars using indicative exchange rates and are approximate. Always check details directly with the
        provider before you book or travel.
      </p>
    </>,
  },
  {
    id: "account",
    title: "Your account",
    body: <>
      <List>
        <li>Give accurate information when you register and keep it up to date.</li>
        <li>Keep your password secret. You are responsible for everything done through your account.</li>
        <li>Tell us straight away at <Mail /> if you think someone else has accessed your account.</li>
        <li>One person, one account. Do not create accounts for others or impersonate anyone.</li>
      </List>
      <p>
        You can stop using the Service at any time. To delete your account, email us at <Mail /> from the address you
        registered with.
      </p>
    </>,
  },
  {
    id: "partners",
    title: "Partners, sponsored content and booking links",
    body: <>
      <p>
        Some destinations and wishlists show a booking button or a "Sponsored" or "Curated with" label. These come from
        Partners who may pay us for the placement or for the visits we send them. We label paid placements so you can
        tell them apart from other content.
      </p>
      <p>
        When you select a booking button, you leave Hodrac and go to the Partner's website. We record that the click
        happened, and the link may tell the Partner that you came from Hodrac. Anything you then buy is a contract
        between you and the Partner, on the Partner's terms and privacy policy. The Partner, not Ionva, is responsible
        for its services, prices, availability, cancellations, refunds and customer support.
      </p>
      <p>A Partner appearing on Hodrac is not a guarantee or endorsement of its services.</p>
    </>,
  },
  {
    id: "trips",
    title: "Travelling with other people",
    body: <>
      <p>
        Hodrac lets you post trips, ask to join other people's trips and message other travellers. Please read this
        section carefully.
      </p>
      <List>
        <li>
          <Term>We do not vet, background-check or verify users.</Term> We cannot confirm anyone's identity, intentions,
          or the accuracy of what they post.
        </li>
        <li>
          Any arrangement to meet, share costs or travel together is solely between you and the other users. You are
          responsible for your own decisions, safety and belongings.
        </li>
        <li>
          Take sensible precautions: meet first in public places, tell someone you trust about your plans, keep
          control of your own documents and money, and do not send money to people you have not met.
        </li>
        <li>
          Report anyone who behaves inappropriately to <Mail />. We may investigate and act on reports, but we are not
          obliged to monitor conversations or resolve disputes between users.
        </li>
      </List>
      <p>
        To the extent the law allows, Ionva is not responsible for the conduct of any user, on or off the Service, or
        for any loss, injury or damage arising from your interactions or travel with other users.
      </p>
    </>,
  },
  {
    id: "content",
    title: "Your content",
    body: <>
      <p>
        "Your content" means anything you add to Hodrac, such as wishlists, trip posts, messages, your profile name and
        picture, and links you share. You keep ownership of your content.
      </p>
      <p>
        You give Ionva a worldwide, non-exclusive, royalty-free licence to host, store, copy, display, adapt (for example
        resize or format) and share your content as needed to run, improve and promote the Service. This licence ends
        when you delete the content or your account, except where your content has been shared with others (for example
        messages already sent in a trip thread) or where we must keep it by law.
      </p>
      <p>
        Content you make visible to others, such as trip posts, messages in trip threads, and wishlists you share by link,
        can be seen by those people. Anyone with a wishlist share link can view a read-only copy until you turn sharing off.
      </p>
      <p>You confirm that you have the right to post your content and that it does not break these terms or the law.</p>
    </>,
  },
  {
    id: "rules",
    title: "Rules of use",
    body: <>
      <p>When using Hodrac you must not:</p>
      <List>
        <li>harass, threaten, abuse, defraud or discriminate against anyone;</li>
        <li>post content that is unlawful, misleading, hateful, sexually explicit or that infringes anyone's rights;</li>
        <li>advertise, solicit money or promote commercial services to other users without our permission;</li>
        <li>share other people's personal information without their consent;</li>
        <li>impersonate any person or misrepresent your age or identity;</li>
        <li>
          scrape, copy or harvest data from the Service, use bots or automated tools against it, or try to interfere
          with its security or operation;
        </li>
        <li>use the Service to plan or carry out anything illegal.</li>
      </List>
      <p>
        We may remove content and suspend or close accounts that break these rules or that we reasonably believe put
        other users or Hodrac at risk. Where reasonable, we will tell you why.
      </p>
    </>,
  },
  {
    id: "ip",
    title: "Our content and intellectual property",
    body: <>
      <p>
        The Service, including its design, software, text, curated wishlists, images we own or license, and the Hodrac
        name and logo, belongs to Ionva or its licensors and is protected by intellectual property laws. You may use it
        for your own personal, non-commercial travel planning. You may not copy, sell, republish or create derivative
        works from it without our written permission.
      </p>
    </>,
  },
  {
    id: "changes-to-service",
    title: "Changes and availability",
    body: <>
      <p>
        We are continually developing Hodrac and may add, change or remove features at any time. We aim to keep the
        Service available but do not guarantee it will be uninterrupted, error-free or secure, and we may suspend it for
        maintenance or for reasons outside our control.
      </p>
    </>,
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    body: <>
      <p>
        The Service is provided "as is" and "as available". To the extent the law allows, we make no warranties, express
        or implied, about the Service or any content, Partner or user, including warranties of accuracy, fitness for a
        particular purpose or non-infringement.
      </p>
      <p>
        Travel carries inherent risks. You are responsible for checking visa, passport, health, insurance and safety
        requirements and any travel advisories before you travel.
      </p>
    </>,
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: <>
      <p>To the extent the law allows:</p>
      <List>
        <li>
          Ionva is not liable for any indirect, incidental, special or consequential loss, or for any loss of profit,
          data, opportunity or goodwill, arising from your use of the Service;
        </li>
        <li>
          Ionva is not liable for the acts or omissions of Partners, other users or any third-party website you reach
          through Hodrac;
        </li>
        <li>
          our total liability to you for any claim relating to the Service is limited to the greater of the amount you
          paid us in the 12 months before the claim (if any) and ₦50,000.
        </li>
      </List>
      <p>
        Nothing in these terms limits liability that cannot be limited by law, including liability for death or personal
        injury caused by our negligence, or for fraud.
      </p>
    </>,
  },
  {
    id: "indemnity",
    title: "Indemnity",
    body: <>
      <p>
        You agree to compensate Ionva for any claims, losses and reasonable costs (including legal fees) arising from your
        content, your breach of these terms, or your dealings with other users or Partners, to the extent caused by you.
      </p>
    </>,
  },
  {
    id: "law",
    title: "Governing law and disputes",
    body: <>
      <p>
        These terms are governed by the laws of the Federal Republic of Nigeria. If you have a complaint, please contact
        us first at <Mail /> so we can try to resolve it informally. If we cannot resolve it within 30 days, either of us
        may take the dispute to the courts of the Federal Capital Territory, Abuja, which will have non-exclusive
        jurisdiction.
      </p>
      <p>
        If you live outside Nigeria, you may also have rights under the consumer laws of your country that these terms
        cannot override.
      </p>
    </>,
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: <>
      <p>
        We may update these terms from time to time. We will change the "last updated" date above and, for significant
        changes, let you know by email or in the app before they take effect. If you keep using Hodrac after the changes
        take effect, you accept the updated terms.
      </p>
      <p>
        If any part of these terms is found unenforceable, the rest stays in effect. If we do not enforce a right
        straight away, we have not waived it.
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

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      updated={UPDATED}
      intro={<p>
        These terms explain the rules for using Hodrac, what you can expect from us, and what we expect from you.
        We've tried to keep them clear. The most important parts are about Partners (section 6) and travelling
        with other people (section 7).
      </p>}
      sections={sections}
    />
  );
}
