import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return locale === "en"
    ? { title: "Terms & Collaboration Guidelines", description: "How working with Guth Pictures works.", robots: { index: false } }
    : { title: "Všeobecné obchodní podmínky", description: "Všeobecné obchodní podmínky fotografa Tomáše Guth Jarkovského.", robots: { index: false } };
}

export default async function VopPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return locale === "en" ? <EnVersion /> : <CsVersion />;
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

function EnVersion() {
  return (
    <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
      <h1 className="text-4xl font-bold mb-2">Terms & Collaboration Guidelines</h1>
      <p className="text-[var(--color-text-muted)] mb-12 text-sm">Tomáš Guth Jarkovský — Guth Pictures</p>

      <p className="text-[var(--color-text-muted)] mb-10 leading-relaxed">
        These guidelines cover how I work with clients — what to expect from me and what I expect from you.
        No legal jargon, just clear terms so we&apos;re on the same page.
      </p>

      <Section title="1. Booking & Agreement">
        <ul>
          <li><strong>How to book:</strong> Send me a message via the website, email, or social media. Once we agree on the date, scope, and price, we&apos;re good to go.</li>
          <li><strong>Deposit:</strong> For larger events or full-day shoots (e.g. larps), I may ask for a deposit upfront. It&apos;s deducted from the final invoice.</li>
          <li><strong>Style acceptance:</strong> By booking, you confirm you&apos;ve seen my portfolio and are happy with my editing style. I won&apos;t change my look to match a different aesthetic.</li>
        </ul>
      </Section>

      <Section title="2. Pricing & Payment">
        <ul>
          <li><strong>Pricing:</strong> Based on what we agree on. Personal and commercial use are priced differently — see the licensing section below.</li>
          <li><strong>Payment:</strong> The remaining balance is due by bank transfer after the shoot, based on the invoice I send you.</li>
          <li><strong>Travel costs:</strong> If the location requires significant travel or overnight stay (common for multi-day larps), those costs are discussed and agreed upon before the shoot.</li>
        </ul>
      </Section>

      <Section title="3. On the Day">
        <ul>
          <li><strong>Portrait sessions:</strong> Please be on time — if you&apos;re late, I can&apos;t extend the session to compensate.</li>
          <li><strong>Events & larps:</strong> Make sure I have proper access to locations, any needed credentials, and a basic schedule. For shoots longer than 5 hours, I need access to food and water and reasonable breaks.</li>
          <li><strong>Things outside my control:</strong> I can&apos;t guarantee specific shots if participants aren&apos;t cooperative, the schedule changes, or lighting conditions are extreme. For outdoor shoots in bad weather, we&apos;ll reschedule without penalties.</li>
          <li><strong>If I get sick:</strong> I&apos;ll let you know immediately, refund any deposit in full, and do my best to recommend a suitable replacement photographer.</li>
        </ul>
      </Section>

      <Section title="4. Delivery">
        <ul>
          <li><strong>Timeline:</strong> Agreed per project — it varies depending on the size of the shoot.</li>
          <li><strong>Format:</strong> Finished JPEGs only. I do not share RAW files under any circumstances.</li>
          <li><strong>Retouching:</strong> Standard colour grading and exposure correction are included. Extensive retouching (removing objects, significant body changes) can be arranged for an extra fee.</li>
          <li><strong>Gallery link:</strong> Photos are delivered via a secure online gallery link, valid for 3 months. Please download and back them up within that time.</li>
          <li><strong>Archive:</strong> I keep delivered photos for 6 months. After that, I can&apos;t guarantee they&apos;re retrievable, and re-sending them may incur a fee.</li>
        </ul>
      </Section>

      <Section title="5. Copyright & Usage">
        <ul>
          <li><strong>Ownership:</strong> All photos remain my intellectual property. You receive a license to use them.</li>
          <li><strong>Personal use:</strong> Unless agreed otherwise, the license covers personal, non-commercial use — printing for yourself, sharing on your private social profiles.</li>
          <li><strong>Commercial use:</strong> Using photos for business promotion, advertising, or any paid/commercial purpose requires a commercial license, which is priced separately and must be stated in our agreement.</li>
          <li><strong>No editing:</strong> Please don&apos;t apply additional filters, heavy crops, or remove any watermark (if present). The photos are delivered in their finished form.</li>
        </ul>
      </Section>

      <Section title="6. TFP (Time for Print) Shoots">
        <ul>
          <li><strong>What it means:</strong> We both give our time — no money changes hands. The goal is building our portfolios.</li>
          <li><strong>Usage:</strong> Both of us can use the photos for personal, non-commercial self-promotion (portfolio, website, social media). Tag each other whenever you post.</li>
          <li><strong>No commercial use:</strong> TFP photos can&apos;t be used for paid advertising, brand promotion, or sold to third parties without prior written agreement.</li>
          <li><strong>Portfolio publication:</strong> Since portfolio-building is the whole point, you automatically agree that I can publish the photos in my portfolio. Revoking this after delivery may be treated as a breach of the TFP agreement.</li>
          <li><strong>Same rules apply:</strong> All delivery and copyright terms above apply to TFP shoots as well.</li>
        </ul>
      </Section>

      <Section title="7. Cancellations & Complaints">
        <ul>
          <li><strong>Cancelling less than 14 days out:</strong> If you cancel a confirmed booking with less than 14 days&apos; notice (and we don&apos;t reschedule), the deposit is non-refundable — it covers my blocked time.</li>
          <li><strong>What you can&apos;t complain about:</strong> Disliking how you look in photos (unless there&apos;s a clear technical error) or disliking my editing style — you agreed to it when booking.</li>
          <li><strong>Genuine technical issues:</strong> Report any real technical problems in writing within 30 days of delivery.</li>
        </ul>
      </Section>

      <Section title="8. Portfolio & Privacy">
        <ul>
          <li><strong>Using your photos in my portfolio:</strong> By booking, you&apos;re okay with me using selected photos for my portfolio and social media. If you&apos;d prefer I don&apos;t, just let me know in writing — I&apos;ll respect that (this doesn&apos;t apply to TFP, see section 6).</li>
          <li><strong>Your data:</strong> I only use your contact and billing details to handle your booking and communicate with you. Nothing else.</li>
        </ul>
      </Section>

      <p className="mt-12 text-sm text-[var(--color-text-ghost)]">
        These guidelines apply to all bookings with Guth Pictures. I&apos;m always happy to discuss specifics before we confirm anything.
      </p>
    </main>
  );
}

function CsVersion() {
  return (
    <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
      <h1 className="text-4xl font-bold mb-2">Všeobecné obchodní podmínky (VOP)</h1>
      <p className="text-[var(--color-text-muted)] mb-12 text-sm">Fotograf Tomáš Guth Jarkovský</p>

      <p className="text-[var(--color-text-muted)] mb-10 leading-relaxed">
        Tyto Všeobecné obchodní podmínky (dále jen „VOP") upravují práva a povinnosti mezi fotografem a objednatelem
        fotografických služeb. Jsou zpracovány v souladu s platnou legislativou České republiky, zejména zákonem č. 89/2012 Sb.,
        občanský zákoník, zákonem č. 121/2000 Sb., autorský zákon, a zákonem č. 634/1992 Sb., o ochraně spotřebitele.
      </p>

      <Section title="1. Úvodní ustanovení a identifikace stran">
        <ul className="space-y-4">
          <li>
            <strong>1.1. Fotograf:</strong>
            <br />Tomáš Guth Jarkovský
            <br />IČO: 01948253
            <br />Sídlo: Hlubocká 598, 373 12 Borovany
            <br />Web: guthpictures.eu
            <br />(dále jen „Fotograf")
          </li>
          <li><strong>1.2. Klient:</strong> Fyzická nebo právnická osoba, která si u Fotografa objedná fotografické služby (dále jen „Klient").</li>
          <li><strong>1.3. Předmět služeb:</strong> Fotograf poskytuje služby zejména v oblastech portrétní fotografie, eventové fotografie a specifického focení larpů (Life Action Role Play). Tyto VOP se vztahují na veškeré nabízené služby, pokud není písemně sjednáno jinak.</li>
        </ul>
      </Section>

      <Section title="2. Objednávka služeb a uzavření smlouvy">
        <ul className="space-y-4">
          <li><strong>2.1.</strong> Objednávka se provádí primárně elektronicky (prostřednictvím webu guthpictures.eu, e-mailem nebo přes oficiální profily na sociálních sítích).</li>
          <li><strong>2.2.</strong> Smlouva o poskytnutí fotografických služeb je uzavřena okamžikem písemného (elektronického) potvrzení termínu a rozsahu služeb oběma stranami, případně uhrazením rezervačního poplatku, pokud byl požadován.</li>
          <li><strong>2.3.</strong> Objednáním služeb Klient stvrzuje, že se seznámil s portfoliem Fotografa, plně akceptuje jeho specifický autorský, fotografický a editační styl a nemá k němu výhrady.</li>
        </ul>
      </Section>

      <Section title="3. Cena, rezervační poplatek a platební podmínky">
        <ul className="space-y-4">
          <li><strong>3.1. Cena:</strong> Cena za služby se řídí platnou nabídkou zaslanou Klientovi nebo individuální dohodou. Rozlišuje se, zda je licence k fotografiím poskytována pro osobní, nebo komerční účely (viz čl. 6).</li>
          <li><strong>3.2. Rezervační poplatek (Záloha):</strong> U vybraných typů služeb (např. větší eventy či celodenní larpy) si Fotograf vyhrazuje právo požadovat předem úhradu rezervačního poplatku. Výše a splatnost poplatku je dohodnuta před potvrzením rezervace. Tento poplatek se odečítá z celkové ceny zakázky.</li>
          <li><strong>3.3. Doplatek:</strong> Zbývající částka je splatná na základě vystavené faktury bezhotovostním převodem na bankovní účet Fotografa.</li>
          <li><strong>3.4. Cestovní a ubytovací náklady:</strong> Cestovní náklady na lokaci a případné náklady na ubytování (typicky u vícedenních larpů mimo místo působiště Fotografa) jsou účtovány zvlášť a jejich orientační výše je s Klientem odsouhlasena předem.</li>
        </ul>
      </Section>

      <Section title="4. Průběh focení a povinnosti stran">
        <ul className="space-y-4">
          <li><strong>4.1. Portrétní focení:</strong> Klient se zavazuje dorazit na focení včas. Při zpoždění ze strany Klienta se sjednaný čas focení neprodlužuje.</li>
          <li><strong>4.2. Eventy a Larpy:</strong> Klient (či organizátor akce) je povinen zajistit Fotografovi adekvátní podmínky pro výkon práce (přístup na lokace, případné akreditace, informace o harmonogramu). U celodenních akcí (přesahujících 5 hodin) má Fotograf nárok na zajištění adekvátní stravy a pitného režimu ze strany Klienta, případně na vyhrazení přiměřené pauzy.</li>
          <li><strong>4.3. Vyšší moc a překážky:</strong> Fotograf nenese odpovědnost za nedodání specifických záběrů z důvodu okolností, které nemohl ovlivnit (nespolupráce účastníků, změny harmonogramu, extrémně špatné světelné podmínky vytvořené organizátorem). V případě krajně nepříznivého počasí u exteriérového focení se strany bez sankcí dohodnou na náhradním termínu.</li>
          <li><strong>4.4. Nemoc Fotografa:</strong> V případě závažné nemoci Fotografa či jiné neočekávané události znemožňující výkon práce je Klient neprodleně informován. Uhrazený rezervační poplatek je v takovém případě Klientovi vrácen v plné výši a Fotograf vyvine maximální úsilí, aby Klientovi doporučil adekvátního náhradního fotografa.</li>
        </ul>
      </Section>

      <Section title="5. Zpracování a dodání fotografií">
        <ul className="space-y-4">
          <li><strong>5.1. Termíny dodání:</strong> Vzhledem k různorodosti zakázek (od krátkých portrétů po vícedenní akce) je termín dodání fotografií sjednáván individuálně pro každou zakázku.</li>
          <li><strong>5.2. Postprodukce:</strong> Fotografie procházejí standardní autorskou postprodukcí (barevné korekce, expozice, ořez). Nadstandardní retuše (odstranění konkrétních objektů, výrazné změny proporcí či pleti), které nejsou součástí běžného stylu, mohou být po dohodě zpoplatněny nad rámec běžné ceny.</li>
          <li><strong>5.3. Formát a neupravené fotografie (RAW):</strong> Přísně zakázáno. Fotograf poskytuje výhradně finální, upravené snímky v elektronickém formátu (JPEG). <strong>Neupravené fotografie ve formátu RAW Fotograf neposkytuje za žádných okolností.</strong></li>
          <li><strong>5.4. Způsob odevzdání:</strong> Fotografie jsou standardně předávány formou zabezpečeného odkazu na online úložiště / webovou galerii. Odkaz zůstává platný po dobu 3 měsíců od jeho odeslání. Klient je povinen si fotografie v této lhůtě stáhnout a zazálohovat.</li>
          <li><strong>5.5. Archivace:</strong> Fotograf uchovává odevzdané snímky ve svém archivu po dobu 6 měsíců od předání zakázky. Po uplynutí této doby nenese Fotograf odpovědnost za jejich případnou ztrátu. Opětovné vyhledání a nahrání fotografií z archivu po uplynutí platnosti původního odkazu může být zpoplatněno.</li>
        </ul>
      </Section>

      <Section title="6. Autorská práva a licenční ujednání">
        <ul className="space-y-4">
          <li><strong>6.1. Autorské dílo:</strong> Fotografie jsou autorským dílem ve smyslu zákona č. 121/2000 Sb., autorský zákon. Veškerá majetková autorská práva náleží Fotografovi.</li>
          <li><strong>6.2. Osobní licence:</strong> Pokud není výslovně sjednáno jinak, získává Klient licenci k užití fotografií výhradně pro osobní, nekomerční účely (tisk do rodinných alb, sdílení na soukromých profilech na sociálních sítích).</li>
          <li><strong>6.3. Komerční licence:</strong> Pro komerční využití (propagace firmy, marketing, prodej produktů, reklama, komerční prezentace larpů/eventů) je nezbytné sjednat komerční licenci. Tato licence podléhá odlišné cenotvorbě a musí být výslovně specifikována v dohodě či na faktuře.</li>
          <li><strong>6.4. Zásahy do díla:</strong> Klient nesmí dodané fotografie jakkoliv graficky upravovat, aplikovat na ně další filtry (např. na Instagramu), drasticky ořezávat či je zbavovat vodoznaku (je-li přítomen), aby nedošlo k degradaci autorského díla.</li>
        </ul>
      </Section>

      <Section title="7. Specifická ujednání pro TFP (Time for Print) focení">
        <ul className="space-y-4">
          <li><strong>7.1. Podstata TFP:</strong> TFP focení probíhá na principu vzájemné bezúplatné výměny času a služeb mezi Fotografem a Klientem (modelem/modelkou). Za samotné focení nenáleží ani jedné straně finanční odměna.</li>
          <li><strong>7.2. Osobní portfolio a kreditování:</strong> Obě strany jsou oprávněny využít výsledné fotografie výhradně pro svou nekomerční sebeprezentaci (osobní portfolio, web, sociální sítě). Při každém zveřejnění na sociálních sítích se obě strany zavazují k vzájemnému označení (uvedení autorství).</li>
          <li><strong>7.3. Zákaz komerčního užití:</strong> Jakékoliv komerční využití TFP fotografií (např. propagace cizích značek, prodej třetím stranám, placená reklama) kteroukoliv ze stran je bez předchozí písemné dohody výslovně zakázáno.</li>
          <li><strong>7.4. Povinnost prezentace:</strong> Jelikož je jediným účelem TFP obohacení portfolia, Klient automaticky souhlasí s publikováním fotografií v portfoliu Fotografa. Odvolání tohoto souhlasu po odevzdání fotografií může být bráno jako porušení podstaty TFP dohody, s možností Fotografa nárokovat finanční kompenzaci za vynaložený čas a práci dle běžného ceníku.</li>
          <li><strong>7.5. Platnost ostatních ustanovení:</strong> Pravidla pro dodání, autorské úpravy a přísný zákaz odevzdávání neupravených RAW formátů a dalších vlastních úprav (čl. 5 a 6) platí i pro TFP focení v plném rozsahu.</li>
        </ul>
      </Section>

      <Section title="8. Storno podmínky a reklamace">
        <ul className="space-y-4">
          <li><strong>8.1. Storno:</strong> Zruší-li Klient závazně sjednaný termín méně než 14 dní předem (a není-li z objektivních důvodů domluven termín náhradní), propadá uhrazený rezervační poplatek v plné výši ve prospěch Fotografa jako náhrada za blokaci termínu.</li>
          <li><strong>8.2. Omezení reklamace:</strong> Důvodem k oprávněné reklamaci nemůže být nespokojenost Klienta s jeho vlastním vzhledem na fotografiích, pokud to není důsledkem zjevné technické chyby, ani nespokojenost s autorským a editačním stylem Fotografa, se kterým byl Klient předem seznámen.</li>
          <li><strong>8.3. Technické vady:</strong> Reklamaci zjevných technických vad je Klient povinen uplatnit písemně bez zbytečného odkladu, nejpozději však do 30 dnů od dodání fotografií.</li>
        </ul>
      </Section>

      <Section title="9. Souhlas s prezentací (Portfolio) a Ochrana osobních údajů">
        <ul className="space-y-4">
          <li><strong>9.1. Portfolio u běžných zakázek:</strong> Fotograf si zakládá na prezentaci své aktuální tvorby. U standardních (placených) zakázek Klient objednáním služeb bere na vědomí a souhlasí s užitím vybraných vzniklých fotografií pro účely portfolia Fotografa. Pokud si Klient vysloveně nepřeje, aby byly fotografie z placeného focení zveřejněny, je oprávněn tuto skutečnost Fotografovi písemně sdělit a Fotograf toto přání bude respektovat (neplatí pro TFP, viz bod 7.4).</li>
          <li><strong>9.2. GDPR:</strong> Zpracování osobních údajů Klienta (jméno, e-mail, telefonní číslo, fakturační údaje) probíhá v souladu s Nařízením Evropského parlamentu a Rady (EU) 2016/679 (GDPR) výhradně za účelem vyřízení objednávky, komunikace a plnění smlouvy. Detailní informace jsou uvedeny v samostatném dokumentu Zásady zpracování osobních údajů.</li>
        </ul>
      </Section>

      <Section title="10. Závěrečná ustanovení">
        <ul className="space-y-4">
          <li><strong>10.1.</strong> Právní vztahy výslovně neupravené těmito VOP se řídí platným právním řádem České republiky.</li>
          <li><strong>10.2.</strong> Fotograf si vyhrazuje právo tyto VOP měnit či doplňovat. Pro Klienta je však vždy závazné to znění VOP, které bylo platné v okamžiku uzavření smlouvy/potvrzení objednávky.</li>
          <li><strong>10.3. Mimosoudní řešení sporů:</strong> Pokud je Klient spotřebitelem, má podle zákona č. 634/1992 Sb., o ochraně spotřebitele, právo na mimosoudní řešení spotřebitelského sporu ze smlouvy o poskytování služeb. Subjektem oprávněným k mimosoudnímu řešení sporu je Česká obchodní inspekce (ČOI), se sídlem Štěpánská 567/15, 120 00 Praha 2, web: www.coi.cz.</li>
        </ul>
      </Section>

      <p className="mt-12 text-sm text-[var(--color-text-ghost)]">
        Tyto Všeobecné obchodní podmínky nabývají platnosti a účinnosti dnem jejich zveřejnění na webu guthpictures.eu.
      </p>
    </main>
  );
}
