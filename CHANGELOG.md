## [2026-10-16] - Smazání klientské galerie maže i fotky v Cloudinary (client-galleries/<slug>/); při chybě 502 a KV zůstane
## [2026-10-15] - Sdílený helper signedUploadRequest pro podepsaný upload do Cloudinary (DraftCard, PhotoUploadSection)
## [2026-10-15] - Admin: po vytvoření galerie hotová zpráva pro klienta (odkaz, heslo, platnost, limit výběru) s tlačítkem Kopírovat zprávu
## [2026-10-15] - isPreviewPage už nepropouští zděděné klíče (toString, constructor, __proto__), /nahled/toString vrací 404
## [2026-10-13] - Blog: pod článkem sekce „Další články“ (pickRelatedPosts, až 3 nejnovější)
## [2026-10-13] - Smazány mrtvé komponenty homepage po editorial redesignu
## [2026-10-13] - sdílený requireAdmin/readJson pro admin API
## [2026-10-13] - Light Tester: LightTesterApp rozdělen na FeedbackModal, SupportToast, share-state a saved-setups, přidán test kodeku
## [2026-10-12] - README: screenshot aplikace
## [2026-10-12] - Docs: modules/gallery/MODULE.md odpovídá skutečným routám, cookie a struktuře
## [2026-10-12] - Stories cron: neschválených AI textů se drží max 10 (mergeAiTexts), schválené a manuální zůstávají
## [2026-10-12] - Mobil: „Vybrané příběhy“ jako swipe carousel (CSS scroll-snap), barva fotky naskočí při swipu
## [2026-10-12] - Mobil: display nadpisy v Syne 700 a velké (hero 25vw, homepage H2 15vw, servisní stránky 12.5vw) místo zmenšeného 800
## [2026-10-12] - Focení 101: měřidlo expozice animuje transform (scaleX) místo width
## [2026-10-12] - Editorial CTA odkazy (Více o mně, Vyzkoušet, Domluvit portrét, Poptat termín) jako tlačítka ve stylu business; inline odkaz podtržený; prázdný odkaz na larpy se nerenderuje
## [2026-10-12] - Homepage: odstraněna akcentní tečka za hero nadpisem (se Syne padala na samostatný řádek)
## [2026-10-12] - Typografie: Syne + Epilogue místo Bodoni Moda + Manrope; homepage nadpisy přes fotky s inverzí, černobílé fotky se zbarví na hover (desktop) / při scrollu (mobil); mobilní velikosti nadpisů bez horizontálního scrollu
## [2026-10-12] - Admin: nahrávání fotek a skrytý hero triptych vyčleněny z AdminDashboard (PhotoUploadSection, HeroTriptychEditor); chyby mazání/★ se zobrazují v sekci fotek
## [2026-10-12] - ContentEditor: ServiceSection, ContactEmailForm, ProfilePhotoUploader
## [2026-10-12] - Sdílený HMAC helper hmac-token.ts pro admin a galerijní tokeny, hasGallerySession
## [2026-10-12] - Galerie: GalleryClient rozdělen na useGallerySelection, ClientLightbox, PasswordGate, HeartIcon, SaveSelectionButton (beze změny chování)
## [2026-10-12] - Limit počtu vybraných fotek v klientské galerii (admin pole, validace v API, UI klienta)
## [2026-10-12] - Klientská galerie: poznámka pro fotografa k výběru (uložení, předvyplnění, zobrazení v adminu)
## [2026-10-12] - Galerie: chyba načtení fotek se zobrazí místo věčného „Načítám…“, hláška při 429 u hesla
## [2026-10-11] - README: popis projektu, stack a spuštění (EN + CZ)
## [2026-10-11] - Eventy a svatby: štítek „Připravujeme / Coming soon“ na stránce i v /sluzby
## [2026-10-11] - Sync galerie: při selhání uploadu ponechá původní záznam fotky
## [2026-10-11] - Galerie: chybová hláška při uložení výběru, Uloženo jen pro aktuální výběr, oprava skloňování
## [2026-10-11] - Admin: stav výběru klienta a štítek blížící se expirace v seznamu galerií
## [2026-10-11] - Klientská galerie: přepínač Vše / Vybrané
## [2026-10-11] - Admin: kopírování/stažení názvů souborů z výběru klienta

## [2026-10-11] - Admin login používá sdílený lib/rate-limit.ts místo vlastní kopie
## [2026-10-10] - Blog: změna slugu maže starý index, kolize slugu vrací 409, validace JSON a publishedAt
## [2026-10-10] - testy middleware pro /admin a /api/admin

## [2026-10-09] - testy pro app/sitemap.ts
## [2026-10-09] - Rate limit na přihlášení do klientské galerie

- Přihlášení do galerie omezeno na 5 pokusů za 15 min na slug a IP (429 po překročení), stejně jako u nabídek.
## [2026-10-08] - fix: neznámá kategorie fotky už neshodí galerii

- Neznámá kategorie z Cloudinary contextu se převede na "portréty"; upload routy vrací 400 pro nepovolenou kategorii.

## [2026-10-02] - Paleta homepage z úvodní fotky

- Papír, inkoust a akcent homepage (včetně footeru, horní linky a grainu) se počítají z barev hero fotky přes Cloudinary `colors`; z fotky se bere jen odstín, jas je pevný kvůli kontrastu. Bez Cloudinary zůstává výchozí paleta.

## [2026-10-02] - Fotky bez dvojité komprese

- `next/image` používá Cloudinary loader: zmenšení i kódování dělá jednou Cloudinary (`q_auto:good`), Next optimizer už fotky znovu nekomprimuje (dřív WebP q75 přes už komprimovaný výstup).

## [2026-10-02] - Vínová paleta homepage, oprava testů hero komponenty

- Homepage používá kostěnou paletu s inkoustovým textem a vínovým akcentem místo rezavé; podstránky (služby, blog, o mně, právní) si nechávají původní paletu.
- Testy staré hero komponenty sdílejí stabilní mock `IntersectionObserver` a znovu procházejí jako celá sada.

## [2026-10-02] - Admin: živý náhled stránek a vizuální ořez fotek

- Fotky i Obsah mají vedle editoru živý náhled stránky (Homepage, Portréty, Business, Eventy; desktop/mobil; CS/EN) s neuloženými změnami. Klik na slot / pole přepne náhled na danou stránku a odscrolluje k místu.
- Ořez fotek: klik nebo tažení bodu zájmu na fotce, zvlášť desktop a mobil (místo psaní procent).
- Nová route `/[locale]/nahled/[page]` jen pro přihlášeného admina, `noindex`; vkládání do iframu povoleno jen z vlastní domény.

## [2026-10-02] - Odstraněna sekce „Firma v akci“ z firemních portrétů

- Sekce zmizela ze stránky i z adminu (texty a fotky). Data v KV zůstávají.

## [2026-10-02] - Editorial stránky max. 1440 px, typografie firemních portrétů

- Všechny editorial stránky mají obsah omezený na 1440 px (pozadí a navbar dál přes celou šířku), velikosti ve `vw` převedeny na `cqi`, aby se zastavily na šířce sloupce.
- Firemní portréty: jednotná typografická škála (h2 / h3 / text), mezery pod nadpisy, ceník s tlačítky, FAQ a kontakt ve dvou sloupcích.
- Portréty a eventy: mezery pod nadpisy, odlišené h3 v ceníku, tlumené doprovodné texty, kontakt na eventech ve dvou sloupcích, široký placeholder fotky vyplní svůj rámeček.

## [2026-10-01] - unit testy pro lib/kv.ts (getKv)

## [2026-10-01] - Editovatelné texty stránek v adminu

- Admin → Obsah umí upravit texty homepage, kreativního portrétu, brandového focení, firemních portrétů, eventů, služeb a O mně (CS/EN), včetně FAQ, kroků a seznamů. Výchozí hodnoty jsou původní texty z kódu.
- Skryty sekce, které web už nevykresluje: reference, nadpis Light Testeru, příplatky firemních portrétů a hero triptych. Data v KV zůstávají.
- Sekce „Hero“ přejmenována na „Patička“ a opraven popisek hvězdičky u fotek (slouží pro návrhy stories).

## [2026-09-29] - Editorialové podstránky

- Přidán společný světlý obal a navigace pro služby, portfolio, profil, blog a právní stránky; mobilní navigace a patička mají větší dotykové cíle.
- Rozcestník služeb, FAQ, kontaktní formulář a profil fotografa používají nový editorialový layout; profil zůstává funkční i bez fotografie z administrace.
- Odstraněn prázdný horní pruh vzniklý rezervou staré navigace na všech redesignových stránkách.
- Portfolio, výpis blogu a detail článku používají světlý editorialový layout; filtr galerie má motivové barvy a chybové/prázdné stavy vlastní čitelné řešení.
- VOP a zásady ochrany osobních údajů mají společnou dokumentovou sazbu s výrazným titulkem a přehlednými sekcemi na desktopu i mobilu.
- Jazykový přepínač zachovává aktuální podstránku i detail článku a je dostupný také v mobilním menu.
- Mobilní menu používá nativní dialog s obsluhou Escape a focusu; stavové zprávy formuláře mají na světlém pozadí přístupný kontrast.
- Provedena kontrola všech redesignovaných podstránek v CS/EN na desktopu i mobilu; podrobnosti jsou v `docs/redesign-verification.md`.

## [2026-09-29] - Oprava kontaktních formulářů redesignu

- Formuláře na editorialových stránkách přebírají barvy konkrétního motivu, mají čitelné popisky, placeholdery a viditelný fokus.
- Síťová chyba při odeslání už nenechá formulář trvale ve stavu odesílání.

## [2026-09-28] - Návrh editorialového redesignu

- Schválen návrh nové homepage a tří samostatných vizuálních světů pro kreativní portrét, business a eventy se svatbami.
- Stanovena nová adresa `/sluzby/eventy-a-svatby`, administrační obrazové sloty a zpětně kompatibilní práce s placeholdery.
- Datový model webu obsahuje zpětně kompatibilní editorialové obrazové sloty, jejich lokalizované popisy, ohniska ořezu a editovatelný titulek eventové stránky.
- Admin API striktně validuje nové obrazové sloty a po uložení obnovuje všechny dotčené lokalizované stránky.
- Přidána společná přístupná navigace, obrazová komponenta s ohniskem ořezu a izolované motivy/fonty pro editorialové stránky.
- Homepage nahrazuje starý animovaný triptych světlou editorialovou kompozicí se službami, autorskou tvorbou, fotografem, foto nástroji a kontaktem.
- Kreativní portrét na stávající URL používá tmavou výstavní kompozici, spravované fotografie, zachovaný ceník a odkaz na Focení 101.
- Business portréty používají světlý přesný grid, administrační obrazové sloty a zachovávají stávající ceník, podmínky, FAQ a poptávku.
- Nová reportážní stránka eventů a svateb má samostatnou adresu, spravované obrazové sloty, ceník, poptávku, interní odkazy a zápis v sitemapě.
- Administrace umožňuje u všech redesignových slotů vybrat fotku, upravit lokalizované popisy a ohnisko ořezu; zvlášť lze měnit titul eventové stránky.
- Doplněny skutečné náhledy Focení 101 a Light Planneru, změna pořadí/vyprázdnění administračních slotů a responzivní ověření pěti šířek.
- Ověření: `docs/redesign-verification.md`.
- Specifikace: `docs/superpowers/specs/2026-09-28-editorial-redesign-design.md`.
- Implementační plán: `docs/superpowers/plans/2026-09-28-editorial-redesign.md`.

## [2026-09-28] - Portfolio Butler

- `docs/superpowers/specs/2026-09-28-portfolio-butler-design.md`: návrh skillu `/portfolio` (Drive → návrh fotek → Cloudinary, max 2 fotky na shoot).
- `docs/superpowers/plans/2026-09-28-portfolio-butler.md`: implementační plán (5 tasků; starší fotky se nepřiřazují, přenahrají se).
- `scripts/portfolio/core.ts`: čisté funkce (shoot z cesty, řazení shootů, limit 2 na shoot, status report).
- `npm run portfolio -- status`: přehled shootů na Drive vs. fotky na webu, porušení limitu, fotky bez shootu.
- `previews`: náhledy 800 px z celého shootu (včetně podsložek) + map.json.
- `upload`: zmenšení na 3000 px, upload do portfolio s context shoot/category/alt, odmítne 3. fotku ze shootu.
- Skill `/portfolio` (`.claude/skills/portfolio-butler`): konverzační flow status → návrh → upload.
- Review opravy: `previews` maže jen vlastní náhledy, limit na shoot počítá přes Admin API (search má zpoždění), shoot z cesty se mapuje na kanonický název z disku.

## [2026-09-24] - SEO a GEO: dostupný obsah a stránky služeb

- Izolované načítání URL parametrů: formulář a filtr již neblokují serverové HTML stránky.
- Ceníky jsou v počátečním HTML a rozbalují se i bez JavaScriptu; zachován odkaz na firemní portréty.
- České a anglické stránky portrétního a brandového focení, metadata, strukturovaná data, interní odkazy a sitemap.
- Viditelné autorství článků a odkaz na fotografa; rozšířen přehled llms.txt.

## [2026-09-23] - Smlouva o dílo a licenční smlouva pro firemní portréty

- `docs/smlouva-business-portrety.md`: smlouva o dílo + licence (Základní/Rozšířená), GDPR, portfolio jen se souhlasem klienta, soud v Praze. FAQ na `/firemni-portrety` z ní vychází.

## [2026-09-23] - Landing page firemních portrétů + ceník v adminu

- Nová stránka `/[locale]/firemni-portrety`: hero, využití, headshoty, Firma v akci, 4 kroky, ceník s příplatky, FAQ (JSON-LD), formulář, sticky CTA. Fotky zatím šrafované placeholdery (`modules/business-portraits/copy.ts`).
- Ceník firemních portrétů editovatelný v adminu (`sluzby.business`: balíčky, příplatky, poznámka). Starší KV data bez `business` doplní defaulty.
- `/sluzby` má třetí kartu s odkazem na novou stránku, stránka je v sitemapě.

## [2026-09-17] - Úvodní triptych bez nástupního fade

- První fotografie ve všech třech panelech se zobrazují bez fade; pomalý zoom a prolínání dalších fotografií zůstávají.
- Regresní test pokrývá první zobrazení, výměnu i návrat na první fotografii.

## [2026-09-17] - perf(homepage): ISR + EU region, poloviční hero payload, lehčí fonty

Naměřeno na produkci před zásahem: TTFB 350–470 ms (cold 2,3 s),
`x-vercel-cache: MISS`, render v `iad1` (Washington), 6 eager hero fotek
(288 kB), 8 woff2 (146 kB), žádný preconnect na Cloudinary.

- **ISR**: `revalidate = 3600` na homepage + `generateStaticParams` a
  `setRequestLocale` v `[locale]/layout.tsx`. Stránka je statická → 0 KV čtení
  na request (dřív 5, z toho `getContent` 2×). Zestatičtěl i portfolio, blog,
  light-tester, foceni-101, privacy a vop pro obě locale. Invalidaci už řeší
  `/api/admin/revalidate` + `revalidatePath` v content route.
- **Region**: `regions: ["fra1"]` do `vercel.json` (crons zůstávají beze změny)
  — konec skoku Frankfurt → Washington → Frankfurt na každý request.
- **Hero**: `TriptychPanel` renderoval `images[prev]` i `images[cur]`; při
  `cur=0` byl `prev` poslední fotka panelu → 6 eager fotek místo 3. `prev` je
  nově `null` do prvního crossfade, panely 2–3 `loading="lazy"`.
- **Fonty**: DM Mono ze 3 řezů × 2 stylů na jeden (400 normal — italic ani
  300/500 se nikde nepoužívaly), DM Sans bez `opsz` axis. 8 souborů → 2.
- **preconnect** na `res.cloudinary.com`, bez `crossorigin` (`<img>` jede
  non-CORS, s atributem by se otevřelo spojení, které se nepoužije).

## [2026-05-31] - fix(nav): Nav.tsx vrací null na homepage — HeroSection má vlastní navbar

## [2026-05-31] - fix(hero): nav linky skupinově pod CTAs, vždy těsně za buttons

- CTAs + nav linky zabaleny do společného flex-col bloku — nav se neodsouvá dolů za H1
- Odstraněn zbytečný mt-4 wrapper

## [2026-05-31] - fix(hero+nav): nav linky blíž CTAs, nav bez border při scrollu

- HeroSection: `mt-9` → `mt-4` na nav linkách pod CTAs
- Nav: odstraněn `border` ze scrolled stavu (frosted glass pill)

## [2026-05-29] - fix(hero): opravit typ heroPhotos pro triptych

- `[string[][]]` → `[HeroPhoto, HeroPhoto, HeroPhoto]` s kategoriemi dle panelu
- stará normalizace vracela prázdná pole → hero neměl žádné fotky
- exportován typ `HeroPhoto` z HeroSection

## [2026-05-29] - fix(nav): frosted glass efekt až po scrollu

- nav nahoře průhledný bez pozadí a blur
- backdrop-blur-xl + background + shadow až po scrollu (>40px)

## [2026-05-08] - fix(homepage): třetí panel hero triptych přejmenován na Larpy/Larps

## [2026-05-08] - fix(homepage): skrýt JG placeholder když není profilová fotka

## [2026-05-08] - feat(admin): file picker pro profilovou fotku

- upload route přijímá volitelný `folder` param (default `"portfolio"`)
- ContentEditor: textové pole nahrazeno file pickerem s náhledem + auto-save po uploadu
- foto se nahrává do složky `site/` na Cloudinary

## [2026-05-08] - refactor(admin): odstranit reliktní hero banner pole

- SiteImages.hero odstraněn z typu, defaults, admin formu, API route i page.tsx catch
- hero triptych zůstává, single-banner pole nikdy nebylo používáno na frontendu

## [2026-05-08] - perf: loading optimalizace hero + fonty

- hero `<img>` tagy: `loading="eager"`, první panel `fetchPriority="high"`
- DM Sans + DM Mono: přidáno `display: "swap"`
- přejmenování "Jakub Guth" → "Tomáš Guth Jarkovský" v hero banneru

## [2026-05-08] - feat(homepage): odstranit sekci Vybraná práce

- SelectedWork carousel odebrán z homepage
- odstraněn import + getGalleryPhotos fetch (portfolioPhotos nepoužito)

## [2026-05-08] - fix(admin): normalizace heroTriptych v admin/fotky

- stejný backward compat fix jako na public page — staré KV [string,string,string] → [string[],string[],string[]]
- opravuje client-side exception při výběru fotek do hero slotů

## [2026-05-08] - fix(hero): backward compat pro staré heroTriptych KV data

- normalizace v page.tsx: starý formát [string,string,string] → [string[],string[],string[]]
- zabraňuje runtime crash když KV obsahuje data v původním formátu

## [2026-05-08] - fix(hero): funkční anchor linky a přepínač jazyků

- anchor linky v hero lište renderovány jako plain <a>, ne Link (locale prefix problém)
- CS/EN přepínač — byl span, teď klikatelné Link s locale prop, aktivní locale zvýrazněn

## [2026-05-08] - feat(hero+admin): multi-foto triptych sloty

- každý ze 3 hero panelů má vlastní pole obrázků (bylo fixní 1)
- admin: klik fotky toggleuje ji do/z aktivního slotu, strip miniatur per slot s × tlačítkem
- badge na fotkách v gridu ukazuje "P1 P2" místo jediného slotu
- SiteImages.heroTriptych: [string, string, string] → [string[], string[], string[]]
- HeroSection.photos prop zjednodušen, buildSrcs odstraněna

## [2026-05-08] - fix(hero): opravit nav linky a CTA buttony

- navLinks v hero sekci — span → Link s reálnými href (#o-mne, #sluzby, #kontakt, /portfolio)
- CTA buttony — prohozené labely opraveny (Chci fotky → kontakt, Portfolio → /portfolio)

## [2026-05-07] - feat(admin): hero triptych picker v adminu

- SiteImages rozšířen o heroTriptych?: [string, string, string]
- images API route: validace + merge heroTriptych při POST
- AdminDashboard: picker sekce — 3 sloty, klik slot → klik fotku → přiřazení, badge P1/P2/P3 na fotce, Uložit button
- fotky/page.tsx: fetchuje getImages() a předává heroTriptych do AdminDashboard
- page.tsx: hero čte images.heroTriptych z KV místo prvních 3 portfolio fotek

## [2026-05-07] - feat(hero): nový HeroSection — triptych, scroll-driven navbar, Kenburns

- HeroSection.tsx: kompletně nahrazen — triptych s fade, vlastní glass navbar, Grain overlay
- Nav.tsx: return null na homepage (HeroSection má vlastní nav)
- page.tsx: -mt-16 na main, předán locale + heroPhotos (první 3 z portfolia)
- visual-components.test.tsx: přidán locale prop, framer-motion mock rozšířen o useScroll/useMotionValueEvent

## [2026-05-04] - feat(admin+homepage): odebrat larp z ContentData, adminu a grid rozšířit na 2 sloupce

- content.ts: odebrán larp ze ServiceContent, defaults, normalizeContent
- ContentEditor.tsx: odstraněna sekce Larpy + larp z emptyContent
- content/route.ts: odstraněna larp validace
- ServiceCards.tsx: grid dynamicky 2 nebo 3 sloupce dle počtu karet

## [2026-05-04] - test: opravit testy po odebrání kategorie larpy

## [2026-05-04] - feat(homepage): odebrat sekci Larpy ze služeb a kategorie z portfolio filtru

- app/[locale]/page.tsx: odstraněn larp ServiceItem (003)
- lib/cloudinary-utils.ts: "larpy" odebráno z CATEGORIES (filtr skryt; existující foto stále viditelná pod "Vše")

## [2026-05-04] - fix(hero): prohodit CTA buttony — primární na kontakt, sekundární na portfolio

## [2026-05-04] - refactor(ui): nahradit ambient glows za brass top linku + tinted grain

- AmbientGlow.tsx: vrací null, odstraněny 3 blur divs
- globals.css: smazány .ambient-glow-root/.ag-* + @keyframes ag-breathe
- body::before: 2px brass gradient linka nahoře (z-index 10000)
- body: statický brass warm gradient 5% accent, 220px výška
- body::after: brass grain přes background-blend-mode: color (#C8A96E / #6B3A1F light)

## [2026-05-04] - feat(typography): přechod z Geist na DM Sans + DM Mono

- layout.tsx: DM_Sans (s opsz osou) + DM_Mono přes next/font/google
- globals.css: @theme inline + --font-sans/--font-mono tokeny v :root

## [2026-04-05] - fix(ui): ambient glows bez viditelných kruhů

- blur 140px + gradient s peakem na 30% místo ostrého středu

## [2026-04-05] - fix(o-mne): odebrat WordReveal animaci, přejmenovat CTA na "Portfolio"

- Bio v sekci "O mně" zobrazeno staticky místo postupného odhalování slov
- cs.json: CTA "Moje tvorba" → "Portfolio"

## [2026-04-03] - feat(ui): ambient glows scrollují se stránkou, cursor glow odstraněn

- Ambient glows přesunuty z fixed na absolute — scrollují se stránkou
- Mouse pozice převedena do document coordinates (clientY + scrollY)
- Cursor-following glow odstraněn
- Počet ambient glow bodů navýšen na 8

## [2026-04-03] - feat(ui): mouse-reactive a ambient glows na homepage

- Přidána komponenta MouseGlow — cursor-following glow (2 vrstvy, spring animace)
- 5 ambient glow bodů reagujících na myš útěkem, návrat na domovskou pozici
- Barva glow odvozena z `--color-accent` (nastavitelné přes admin theme editor)
- prefers-reduced-motion podpora

## [2026-04-03] - fix(sluzby): úprava buttonů v sekci služby

- Odstraněn button "Rezervovat termín" ze spodní části rozevřeného balíčku
- Odkaz "Vybrat balíček" nahrazen buttonem "Mám zájem" / "I'm interested" (stejná funkcionalita)

## [2026-03-30] - feat(vop): stránka obchodních podmínek s českou a anglickou verzí

- Nová stránka `/vop` — CS: plné VOP (právní dokument), EN: neformální collaboration guidelines
- Odkaz "Obchodní podmínky" / "Terms & Guidelines" přidán do footeru

## [2026-03-29] - fix(Nav): navbar nahoře má stejné pozadí jako při scrollování

## [2026-03-29] - feat: výběr balíčku předvyplní kontaktní formulář

- Každý balíček v ServiceCards má tlačítko "Vybrat balíček →" s URL params `?package=&service=`
- ContactForm čte params přes useSearchParams a předvyplní textarea
- Přidány překlady `vybrat` a `packagePreset` (cs/en)
- Opraveny TS chyby v testech (blog-route, upload-route)

## [2026-03-28] - fix: AnimatedSection sekce neviditelné — clipPath nahrazen opacity+y

- clipPath: "inset(0 0 100% 0)" způsoboval neviditelnost sekcí (whileInView se nespustil)
- Nahrazeno opacity: 0→1 + y: 32→0

## [2026-03-27] - feat: clip-path scroll animace, footer z hero obsahu, admin email

- AnimatedSection: fade-in/slide nahrazen clip-path reveal (žádné prosvítání hero fotky)
- Footer: title + subtitle ze stejného zdroje jako hero banner (přes props z layoutu)
- Admin obsah: nová sekce pro úpravu kontaktního emailu
- lib/content: getContactEmail / setContactEmail (KV + env fallback)
- Nová API route /api/admin/email (GET + POST, validace formátu)

## [2026-03-27] - fix(carousel): plynulý loop + 3D coverflow efekt

- Přepsáno z CSS animace na requestAnimationFrame + přímá DOM manipulace (bez React re-renderů)
- Každá karta dostává scale + rotateY dynamicky podle vizuální vzdálenosti od středu viewportu
- Loop: 3 kopie setu, reset na set2 → žádný skok, nekonečná plynulost
- Odstraněn statický scale podle indexu, který způsoboval progresivní zvětšování

## [2026-03-27] - feat(admin/theme): live náhled kombinací barev pod color picky

- Pod panely výběru barev přibyla sekce Náhled
- Dvě karty (dark/light) ukazují text, muted, ghost, elevated, surface, overlay a accent button
- Náhled reaguje živě na změny barev (inline styly z aktuálního stavu)

## [2026-03-27] - fix(admin): hvězdička vždy klikatelná, title linkuje na homepage

- Hvězdička (Selected Work) dostala `z-10` — overlay ji už nepřekrývá při hoveru
- Neoznačené fotky mají hvězdičku vždy viditelnou (ztlumená), ne jen při hoveru
- Titulek "Admin — Guth Pictures" je klikatelný link na "/"

## [2026-03-27] - feat: auto-komprese fotek při uploadu + kvalitnější hero

- Upload: Canvas-based komprese v prohlížeči (max 4000px, JPEG 88%) — nahrát jde jakákoliv fotka z foťáku
- Limit zvýšen na 100 MB (raw vstup, před kompresí)
- Hero: transformace `w_2560,q_90,e_sharpen:60` místo `w_1920,q_auto`

## [2026-03-27] - feat: výběr fotek do Selected Work v adminu + větší karty carouselu

- Admin: hvězdičkový toggle na každé fotce označí ji jako Selected Work (Cloudinary tag `selected_work`)
- Nový API endpoint `/api/admin/toggle-selected` (POST) pro přidání/odebrání tagu
- `SelectedWork`: filtruje dle `selected` flagu, fallback na prvních 10 pokud nic není označeno
- `GalleryPhoto` type: přidáno volitelné pole `selected?: boolean`
- `lib/cloudinary.ts`: fetchuje tagy z Cloudinary, mapuje `selected_work` na `selected`
- Karty carouselu zvětšeny z 210×290 na 270×370 px

## [2026-03-27] - fix: server-only nelze importovat z Client Component

- Typy `ColorSet`, `ThemeColors` a `defaultColors` přesunuty do `lib/theme-types.ts` (bez server-only)
- `lib/theme.ts` re-exportuje typy z `theme-types.ts`, zachovává `server-only` pro KV logiku
- `ThemeEditor.tsx` importuje z `lib/theme-types.ts`
- `ServiceCards`: odebrány nepoužívané props, přidány aria atributy pro přístupnost

## [2026-03-27] - Admin: editor barev dark/light motivu

- Nová admin sekce `/admin/tema` s color pickery pro 9 CSS proměnných × 2 motivy
- Barvy uloženy v Vercel KV, injektovány jako `<style>` tag v layoutu
- Live preview při změně barvy, Reset na default hodnoty
- API route `GET/POST/DELETE /api/admin/theme` s hex validací

## [2026-03-26] - ServiceCards: inline expand balíčků

- Karty služeb jsou klikatelné, klik rozbalí balíčky přímo v kartě (accordion)
- Více karet lze mít rozbalených současně, druhý klik sbalí danou kartu
- Odstraněny portfolio linky z karet
- Odstraněn globální detail view (nahrazen inline expandem)

## [2026-03-26] - Navbar: fix čitelnosti textu nad hero v light módu

- Nav na hero stránce nyní vždy používá světlý text (přepis CSS vars inline), protože hero foto je vždy tmavé

## [2026-03-26] - Navbar: odstraněn hardcoded gradient, top overlay přesunut na hero

- Nav nahoře průhledný (backdrop-blur-sm), bez hardcoded black gradientu
- Top overlay přesunut do HeroSection, theme-aware přes --color-bg

## [2026-03-26] - Lightbox v carouselu na homepage

- Kliknutí na fotku v `SelectedWork` otevře `Lightbox` s navigací a klávesovými zkratkami

## [2026-03-26] - Opravy z code review

- `key={pkg.id}` místo `key={i}` v PackageEditor — stabilní klíče při mazání balíčků
- `selectedService!` assertions odstraněny — TypeScript narrowing přes `selectedService !== null`
- `filter(Boolean)` na includes při renderování — prázdné řádky z textarey nevyrobí prázdné `<li>`
- Délkové limity v content validaci (MAX_SHORT 200, MAX_LONG 2000, MAX_PACKAGES 10, MAX_INCLUDES 20)
- `isServiceContent`: packages volitelné pro backward compat, includes items validovány jako string
- Backward compat: `getContent` normalizuje KV data — doplní `packages: []` a `id` pokud chybí
- Logout cookie — přidány `httpOnly`, `secure`, `sameSite` při mazání
- Login rate limit fail-closed v produkci bez KV; chybějící `ADMIN_PASSWORD_HASH` vrací 401 místo 500
- `AdminNav`: startsWith fix (`href + "/"`) + `aria-current="page"`

## [2026-03-26] - Admin rozdělen na podstránky

- `/admin` → redirect na `/admin/fotky`
- `/admin/fotky` — správa fotek
- `/admin/obsah` — editor textů a ceníku
- `/admin/blog` — editor blogu
- Sdílený `AdminShell` (auth check + header + nav tabs)

## [2026-03-26] - Ceník editovatelný z adminu

- Ceníková data přesunuta z messages do KV storage (`lib/content.ts`)
- Sdílený typ `PricingPackage` v `lib/types.ts`
- `ContentEditor` rozšířen o editor balíčků (název, cena, délka, co zahrnuje, poznámka) pro každou službu
- Validace v `/api/admin/content` rozšířena o strukturu packages

## [2026-03-26] - Rozbalovací ceník na kartách služeb

- Nová komponenta `ServiceCards` — každá karta má tlačítka „Portfolio" a „Ceník"
- Klik na Ceník animovaně vymění mřížku karet za panel s balíčky (framer-motion AnimatePresence)
- Ceníková data v `messages/cs.json` + `messages/en.json` (packages + note)

## [2026-03-25] - Film grain + ambient glow, sjednocení pozadí

- Odstraněn explicitní `bg-[var(--color-bg)]` z SelectedWork — carousel sdílí barvu body
- `body::after` — statický SVG feTurbulence grain (opacity 3.8% dark / 2.2% light), analogová textura
- `body` background-image — subtilní radial amber glow přes horní část stránky (přes hero přechod)

## [2026-03-25] - Odstraněn frosted glass, carousel omezen na max-width

- Sekce o-mne, sluzby, kontakt: `backdrop-blur-2xl bg-[var(--glass-bg)]` → solid `bg-[var(--color-bg-elevated)]`
- SelectedWork carousel obalén do `max-w-6xl mx-auto` — nepůjde přes stránkový limit, fade na okrajích kontejneru

## [2026-03-25] - Homepage: frosted glass sekce, theme-aware hero gradient

- Přidána CSS proměnná `--glass-bg` (dark: rgba(10,10,11,0.78), light: rgba(247,245,242,0.82))
- Hero overlay změněn z `from-black` na gradient pouze dole s `var(--color-bg)`, funguje v obou themes
- Hero texty a buttony přepsány na `--color-text` / `--color-bg` (žádný hardcoded white)
- Sekce o-mne, sluzby, kontakt mají `backdrop-blur-2xl bg-[var(--glass-bg)]` — frosted glass přes parallax pozadí

## [2026-03-25] - Dark/light mode: CSS variables, ThemeProvider, ThemeToggle v Navu

- Přidán `next-themes` s class-based přepínáním (dark default)
- CSS tokeny v `globals.css`: dvě sady (`dark` / `.light`), warm off-black dark, cream paper light
- Nové komponenty: `ThemeProvider.tsx`, `ThemeToggle.tsx` (Sun/Moon + Framer Motion fade)
- ThemeToggle v desktop navu (za lang switcher) + v mobile draweru
- Aktualizovány: Nav, Footer, BlogPostCard, ContactForm, PhotoGrid, ScrollVelocityStrip → CSS vars
- Cinematic sekce (SelectedWork, Lightbox) záměrně zachovány dark
- Globální color transitions 300ms ease, obrázky a SVG vyloučeny

## [2026-03-23] - AI blog generátor (Claude Code workflow)

- `scripts/post-article.ts` – CLI skript pro uložení článku do Vercel KV jako draft
- `lib/blog-topics.ts` – 25 předpřipravených SEO témat k fotografii (svatby, portréty, Brno, tipy)
- `tsx` přidán do devDependencies, npm script `post-article`

## [2026-03-22] - UI polish: Nav, BlogPostCard, Footer, PortfolioFilter, Lightbox

- Nav: aktivní locale zvýrazněn (text-white font-medium), mobile menu s AnimatePresence animací
- BlogPostCard: vertikální layout, date + separator linka, animated ArrowRight, hover scale na obrázku
- Footer: přidány quick nav linky (Portfolio, Blog, Kontakt) + email odkaz, logo + tagline vlevo
- PortfolioFilter: konzistentní border na inactive buttonech (opravena nekonzistentní třída na span)
- Lightbox: X, ChevronLeft, ChevronRight z lucide-react místo Unicode znaků

## [2026-03-22] - UI: service cards s ikonami + numbered pattern, SelectedWork header

- Service cards: přidány ikony (Camera/Heart/Sword), mono číslování 001–003, flex layout s ikonou i textem
- SelectedWork: přidán h2 nadpis "Vybraná práce" / "Selected work" (přeloženo v cs.json + en.json)

## [2026-03-21] - hero foto jako fixovaný background, průhledný nav na home stránce

## [2026-03-21] - Blog sekce

- `lib/blog.ts`: CRUD nad Vercel KV (getBlogPosts, getBlogPost, saveBlogPost, deleteBlogPost)
- `app/[locale]/blog/page.tsx`: seznam publikovaných příspěvků
- `app/[locale]/blog/[slug]/page.tsx`: detail příspěvku s Markdown renderingem (`react-markdown`)
- `components/BlogPostCard.tsx`: karta příspěvku s cover obrázkem
- `components/admin/BlogEditor.tsx`: CRUD editor v admin panelu (CS/EN, draft/publish, slug auto-gen)
- `app/api/admin/blog/route.ts` + `[id]/route.ts`: API pro blog
- Nav: přidán odkaz „Blog", blog stránky mají stejný nav jako portfolio
- `app/globals.css`: přidány styly `.blog-content` pro Markdown rendering
- Překlady: `blog.*` klíče přidány do cs.json a en.json

## [2026-03-06] - Přímý upload fotek na Cloudinary bez komprese

- Nový endpoint `/api/admin/upload-signature` generuje signed upload params
- `AdminDashboard.tsx`: klient uploaduje přímo na `api.cloudinary.com` — bez client-side komprese, plná kvalita
- Odstraněna závislost `browser-image-compression`
- Testy aktualizovány (8 testů pro nový direct upload flow)

## [2026-03-06] - Testy: AnimatedSection, HeroSection, PortfolioFilter, Lightbox

- `__tests__/visual-components.test.tsx`: 25 testů pro nové vizuální komponenty
- AnimatedSection (2 testy), HeroSection (4), PortfolioFilter (6), Lightbox (13)
- Fix: Lightbox close button přidal `stopPropagation()` (event bubbloval na backdrop → double call)

## [2026-03-06] - Vizuální vylepšení: animace, hero, lightbox navigace, scroll reveal

- Framer Motion nainstalován
- `AnimatedSection.tsx`: reusable scroll reveal wrapper (whileInView)
- `HeroSection.tsx`: hero s Framer Motion animací textu, scroll indicator, připraveno na Cloudinary bg foto
- `SelectedWork.tsx`: bento grid sekce z Cloudinary fotek (první 3–6), hover efekty, scroll reveal
- `Nav.tsx`: průhledný na top, po scrollu bg-black/80 backdrop-blur
- `PhotoGrid.tsx`: hover scale + overlay na každé fotce
- `Lightbox.tsx`: navigace šipkami (klávesy + tlačítka), AnimatePresence animace
- `PortfolioFilter.tsx`: animovaný aktivní pill přes `layoutId`
- `app/[locale]/page.tsx`: HeroSection, SelectedWork (graceful fallback), about 2-column layout, AnimatedSection wrappery

## [2026-03-06] - Testy: auth-edge a AdminDashboard komprese

- `__tests__/auth-edge.test.ts`: 11 testů pro signToken/verifyToken (roundtrip, expiraci, tampered token, chybějící secret)
- `__tests__/AdminDashboard-compression.test.tsx`: 7 testů pro novou kompresní logiku (parametry, komprimovaný soubor na API, status přechody, chybové stavy)

## [2026-03-06] - Komprese obrázků v browseru před uploadem

- `browser-image-compression` instalováno
- `AdminDashboard`: fotky > 3MB se automaticky zkomprimují před odesláním (max 3MB / 4000px)
- Status `"compressing"` přidán do `FileStatus`, vizuální feedback v thumbnail preview

## [2026-03-05] - Fix: login API route blokována intl middlewarem

- `proxy.ts`: přidáno early return pro `/api` cesty (intl middleware přidával locale prefix → 404)
- `proxy.ts`: matcher rozšířen o `/api/admin/:path*`

## [2026-03-05] - Security: HMAC auth token, rate limiting, MIME validace

- `lib/auth-edge.ts` (nový): Edge-compatible HMAC-SHA256 sign/verify token
- `lib/auth.ts`: cookie hodnota "1" → podepsaný HMAC token; `authCookieConfig(token)`
- `proxy.ts`: async middleware, ověření HMAC tokenu místo `=== "1"`
- `app/api/admin/login/route.ts`: timing-safe compare (`crypto.timingSafeEqual`), rate limiting 5/15min přes Vercel KV, logování neúspěšných pokusů
- `app/api/admin/upload/route.ts`: MIME validace magic bytes (JPEG/PNG/WebP/GIF), file null-check, odstraněna duplicitní Cloudinary konfigurace

Vyžaduje novou env proměnnou: `AUTH_SECRET` (náhodný string, min 32 znaků)

## [2026-03-05] - UI vylepšení — typografie, spacing, interaktivita

- `Nav.tsx`: logo "Guth Pictures" + hover efekt
- `page.tsx`: hero text-6xl/7xl, padding py-32/40, CTA px-8 py-4; o-mne border-t separator + mt-12 bio; sluzby karty hover efekt + group class
- `ContactForm.tsx`: space-y-6, label font-medium, focus:ring, success/error styled div boxy, placeholdery
- `messages/cs.json` + `en.json`: přidány namePlaceholder, emailPlaceholder, messagePlaceholder
- `portfolio/page.tsx`: přepsán na getTranslations server API, intro sekce pt-32 pb-16
- `PhotoGrid.tsx`: md:columns-3 lg:columns-4 breakpointy, gap-4, figure wrapper s bg-zinc-900

## [2026-03-05] - Editace textů z adminu (Vercel KV)

- `lib/content.ts`: ContentData typ, getContent(locale) s KV fallbackem na JSON defaults, setContent(locale, data)
- `app/api/admin/content/route.ts`: GET + POST s auth checkem a revalidatePath
- `components/admin/ContentEditor.tsx`: client komponenta, tabs CZ/EN, formulář pro Hero / O mně / Služby
- `app/[locale]/page.tsx`: async server komponenta, editovatelné texty z getContent(), UI strings z getTranslations()
- `app/admin/page.tsx`: přidán ContentEditor

## [2026-03-05] - Zjednodušení na 2 stránky

- Home page rozšířena o sekce #o-mne, #sluzby, #kontakt (single-page scroll)
- Nav.tsx: anchor linky na home, jiná navigace na /portfolio
- Smazány podstránky: /o-mne, /sluzby, /kontakt
- Sitemap aktualizována (jen / a /portfolio)
- Messages: odstraněny orphan meta záznamy pro smazané stránky

## [2026-03-05] - SEO

- `generateMetadata` na všech stránkách (CZ/EN) — title, description, openGraph
- `app/sitemap.ts` — sitemap.xml s hreflang alternativami
- `app/robots.ts` — robots.txt (blokuje /admin a /api/)
- JSON-LD schema (LocalBusiness) v locale layoutu
- `messages/*.json` — přidána sekce `meta` s titulky a popisy pro každou stránku
- Layout: `metadataBase` + title template

## [2026-03-05] - Kontaktní formulář (Formspree)

- `components/ContactForm.tsx` — formulář s validací, loading stavem, success/error zprávou
- `app/[locale]/kontakt/page.tsx` — zapojení ContactForm
- Přidány překlady `sending`, `success`, `error` do cs.json a en.json
- `.env.local` — přidáno `NEXT_PUBLIC_FORMSPREE_FORM_ID`

## [2026-03-05] - Admin rozhraní

- `lib/auth.ts` — cookie-based autentizace (ADMIN_PASSWORD, 8h session)
- `proxy.ts` — rozšířen o admin ochranu (redirect na /admin/login)
- `app/admin/layout.tsx` — vlastní layout bez locale/Nav/Footer
- `app/admin/login/page.tsx` — přihlašovací formulář
- `app/admin/page.tsx` — dashboard (seznam fotek, upload, smazání)
- `components/AdminDashboard.tsx` — klientská komponenta pro správu fotek
- `app/api/admin/login|logout|upload|delete` — API routes
- `lib/cloudinary.ts` — přesunuto na server-only (`import "server-only"`)
- `lib/cloudinary-utils.ts` — klientsky bezpečné utility (URL helpers, typy)
- `next.config.ts` — přidáno `serverExternalPackages: ["cloudinary"]`

## [2026-03-05] - Cloudinary integrace + portfolio grid

- `lib/cloudinary.ts` — Cloudinary client, `getGalleryPhotos()`, `cloudinaryUrl()`, `blurUrl()`
- `components/PhotoGrid.tsx` — masonry grid přes CSS columns, `next/image` s blur placeholder
- `app/[locale]/portfolio/page.tsx` — načítá fotky ze Cloudinary, renderuje PhotoGrid
- `next.config.ts` — přidána doména `res.cloudinary.com` pro next/image
- `.env.local` — šablona s proměnnými (vyplnit Cloudinary credentials)

## [2026-03-05] - Obsah stránek: Home, O mně, Služby

- Texty pro Home (hero sekce, 2 CTA tlačítka), O mně (bio, CTA) a Služby (3 karty: portréty, svatby, larpy)
- Brand: Guth Pictures, Praha + cestování po ČR
- Aktualizovány messages/cs.json a messages/en.json
- Footer přejmenován na "Guth Pictures"

## [2026-03-05] - UI komponenty: Nav a Footer

- `components/Nav.tsx` — navigace s locale-aware linky, aktivní stav, přepínač CZ/EN
- `components/Footer.tsx` — copyright s rokem, tagline
- `i18n/navigation.ts` — typované next-intl navigation helpers (Link, usePathname, useRouter)
- Přidány `footer` překlady do cs.json a en.json
- Nav a Footer zapojeny do `app/[locale]/layout.tsx`

## [2026-03-05] - Základ: next-intl, locale routing, folder struktura

- Nainstalováno `next-intl`
- Vytvořen locale routing CZ/EN (`i18n/routing.ts`, `i18n/request.ts`, `proxy.ts`)
- Přidán `withNextIntl` plugin do `next.config.ts`
- Vytvořeny překlady `messages/cs.json` + `messages/en.json`
- Folder struktura: `app/[locale]/` s placeholder stránkami (home, portfolio, sluzby, o-mne, kontakt)
- `app/admin/page.tsx` (placeholder, bez locale)
- Root layout zjednodušen, locale layout s NextIntlClientProvider a dark theme

## [2026-03-26] - hero buttons: přejmenování a prohození pořadí
- "Napsat mi" → "Chci fotky" (CTA, primární, první)
- "Prohlédnout portfolio" → "Moje tvorba" (sekundární, druhý)
- en: "Book a shoot" / "My work"

## [2026-03-26] - hero nav scrim: neutrální black overlay místo --color-bg
- přidána proměnná --hero-scrim-top (dark: 0.65, light: 0.30 alpha)
- odstraněn efekt barevného pásu u navbaru v obou themes
