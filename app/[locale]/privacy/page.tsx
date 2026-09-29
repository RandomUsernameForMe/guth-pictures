import type { Metadata } from "next";
import { contactEmail } from "@/lib/config";
import { EditorialSubpage } from "@/modules/editorial/components/EditorialSubpage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return locale === "en"
    ? { title: "Privacy Policy", description: "How Guth Pictures handles your personal data.", robots: { index: false } }
    : { title: "Zásady zpracování osobních údajů", description: "Jak Guth Pictures zpracovává vaše osobní údaje.", robots: { index: false } };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <EditorialSubpage active="legal" className="ed-secondary-legal">{locale === "en" ? <EnVersion /> : <CsVersion />}</EditorialSubpage>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-[var(--color-border)]">{title}</h2>
      <div className="text-[var(--color-text-muted)] leading-relaxed text-sm [&_ul]:list-none [&_ul]:space-y-3 [&_strong]:text-[var(--color-text)]">
        {children}
      </div>
    </section>
  );
}

function CsVersion() {
  return (
    <article className="ed-legal">
      <h1 className="text-4xl font-bold mb-2">Zásady zpracování osobních údajů</h1>
      <p className="text-[var(--color-text-muted)] mb-12 text-sm">
        Tomáš Guth Jarkovský · Guth Pictures · Platné od 1. 1. 2025
      </p>

      <Section title="1. Správce osobních údajů">
        <p>
          Správcem osobních údajů je Tomáš Guth Jarkovský, IČO: [doplnit], se sídlem Praha, Česká republika,
          e-mail: {contactEmail} (dále jen „Fotograf").
        </p>
      </Section>

      <Section title="2. Jaké údaje zpracováváme">
        <ul>
          <li><strong>Kontaktní a smluvní údaje:</strong> jméno a příjmení, e-mailová adresa, telefonní číslo, fakturační adresa.</li>
          <li><strong>Komunikace:</strong> obsah zpráv zaslaných prostřednictvím kontaktního formuláře nebo e-mailu.</li>
          <li><strong>Fotografie:</strong> vizuální záznamy vzniklé při fotografování, které mohou zachycovat podobu fyzické osoby.</li>
        </ul>
      </Section>

      <Section title="3. Účel a právní základ zpracování">
        <ul>
          <li><strong>Plnění smlouvy (čl. 6 odst. 1 písm. b) GDPR):</strong> zpracování objednávky, komunikace, vystavení faktury, dodání fotografií.</li>
          <li><strong>Oprávněný zájem (čl. 6 odst. 1 písm. f) GDPR):</strong> prezentace portfolia na webových stránkách a sociálních sítích (u standardních zakázek, pokud klient nevznese námitku).</li>
          <li><strong>Plnění právní povinnosti (čl. 6 odst. 1 písm. c) GDPR):</strong> uchovávání daňových dokladů po dobu stanovenou zákonem.</li>
        </ul>
      </Section>

      <Section title="4. Doba uchovávání">
        <ul>
          <li>Smluvní dokumenty a faktury: 10 let od vystavení (daňová povinnost).</li>
          <li>Kontaktní a komunikační údaje: po dobu trvání smluvního vztahu a 3 roky po jeho ukončení.</li>
          <li>Fotografie v portfoliu: do vznesení námitky nebo odvolání souhlasu.</li>
        </ul>
      </Section>

      <Section title="5. Příjemci osobních údajů">
        <p>
          Osobní údaje nejsou předávány třetím stranám za účelem marketingu. Mohou být předány pouze
          zpracovatelům zajišťujícím technické služby (hosting, cloudové úložiště, účetní software),
          kteří jsou vázáni smlouvou o zpracování osobních údajů.
        </p>
      </Section>

      <Section title="6. Předávání do třetích zemí">
        <p>
          Fotografie mohou být uloženy na platformách provozovaných mimo EHP (např. Cloudinary, USA).
          Přenos probíhá na základě standardních smluvních doložek Evropské komise.
        </p>
      </Section>

      <Section title="7. Vaše práva">
        <ul>
          <li><strong>Právo na přístup:</strong> kdykoli si můžete vyžádat přehled údajů, které o vás zpracováváme.</li>
          <li><strong>Právo na opravu:</strong> pokud jsou vaše údaje nepřesné, opravíme je.</li>
          <li><strong>Právo na výmaz:</strong> za podmínek GDPR můžete požádat o smazání vašich údajů.</li>
          <li><strong>Právo vznést námitku:</strong> zejména proti zpracování na základě oprávněného zájmu (portfolio).</li>
          <li><strong>Právo na přenositelnost:</strong> na vyžádání poskytneme vaše údaje ve strojově čitelném formátu.</li>
          <li><strong>Právo podat stížnost:</strong> u Úřadu pro ochranu osobních údajů, Pplk. Sochora 27, 170 00 Praha 7, www.uoou.cz.</li>
        </ul>
      </Section>

      <Section title="8. Kontakt">
        <p>
          Veškeré dotazy, námitky nebo žádosti o výkon práv zasílejte na:{" "}
          <a href={`mailto:${contactEmail}`} className="underline hover:text-[var(--color-text)] transition-colors">
            {contactEmail}
          </a>
        </p>
      </Section>

      <p className="mt-12 text-sm text-[var(--color-text-ghost)]">
        Tyto zásady jsou platné od 1. 1. 2025. Fotograf si vyhrazuje právo je kdykoli aktualizovat.
      </p>
    </article>
  );
}

function EnVersion() {
  return (
    <article className="ed-legal">
      <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-[var(--color-text-muted)] mb-12 text-sm">
        Tomáš Guth Jarkovský · Guth Pictures · Effective 1 January 2025
      </p>

      <Section title="1. Data Controller">
        <p>
          The data controller is Tomáš Guth Jarkovský, ID: [fill in], Prague, Czech Republic,
          e-mail: {contactEmail} (the "Photographer").
        </p>
      </Section>

      <Section title="2. What data we process">
        <ul>
          <li><strong>Contact & contract data:</strong> name, e-mail address, phone number, billing address.</li>
          <li><strong>Communication:</strong> messages sent via the contact form or e-mail.</li>
          <li><strong>Photographs:</strong> visual recordings made during the shoot, which may depict the client&apos;s likeness.</li>
        </ul>
      </Section>

      <Section title="3. Purpose and legal basis">
        <ul>
          <li><strong>Performance of a contract (Art. 6(1)(b) GDPR):</strong> processing your order, invoicing, delivering photos.</li>
          <li><strong>Legitimate interest (Art. 6(1)(f) GDPR):</strong> portfolio presentation on the website and social media (standard paid shoots, unless you object).</li>
          <li><strong>Legal obligation (Art. 6(1)(c) GDPR):</strong> retention of tax documents as required by law.</li>
        </ul>
      </Section>

      <Section title="4. Retention periods">
        <ul>
          <li>Contracts and invoices: 10 years (tax law).</li>
          <li>Contact and communication data: for the duration of the contract and 3 years thereafter.</li>
          <li>Portfolio photographs: until you object or withdraw consent.</li>
        </ul>
      </Section>

      <Section title="5. Recipients">
        <p>
          Your data is not shared with third parties for marketing. It may be passed to processors providing
          technical services (hosting, cloud storage, accounting software) bound by data processing agreements.
        </p>
      </Section>

      <Section title="6. International transfers">
        <p>
          Photographs may be stored on platforms outside the EEA (e.g. Cloudinary, USA).
          Transfers are covered by EU Standard Contractual Clauses.
        </p>
      </Section>

      <Section title="7. Your rights">
        <ul>
          <li><strong>Right of access:</strong> request a copy of your data at any time.</li>
          <li><strong>Right to rectification:</strong> if your data is inaccurate, we will correct it.</li>
          <li><strong>Right to erasure:</strong> request deletion under GDPR conditions.</li>
          <li><strong>Right to object:</strong> especially to processing based on legitimate interest (portfolio).</li>
          <li><strong>Right to data portability:</strong> we can provide your data in a machine-readable format.</li>
          <li><strong>Right to lodge a complaint:</strong> with the Czech Office for Personal Data Protection (ÚOOÚ), www.uoou.cz.</li>
        </ul>
      </Section>

      <Section title="8. Contact">
        <p>
          For any questions, objections, or rights requests:{" "}
          <a href={`mailto:${contactEmail}`} className="underline hover:text-[var(--color-text)] transition-colors">
            {contactEmail}
          </a>
        </p>
      </Section>

      <p className="mt-12 text-sm text-[var(--color-text-ghost)]">
        This policy is effective from 1 January 2025. The Photographer reserves the right to update it at any time.
      </p>
    </article>
  );
}
