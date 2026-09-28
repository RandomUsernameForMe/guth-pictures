# Editorial redesign Guth Pictures

Datum: 28. 9. 2026  
Stav: schválený návrh před implementací

## Cíl

Převést současný web do zapamatovatelného fotografického editoriálu podle referencí v `REDESIGN-PLAN.md`. Homepage, kreativní portrét, business portrét a eventy se svatbami musí být na první pohled čtyři odlišné kompozice, ale musí sdílet značku, navigaci, kontakt, lokalizaci a administrační data.

## Rozsah a adresy

- Homepage: `/[locale]`
- Kreativní portrét: `/[locale]/sluzby/portretni-foceni`
- Business portrét: `/[locale]/firemni-portrety`
- Eventy a svatby: `/[locale]/sluzby/eventy-a-svatby`
- Rozcestník `/[locale]/sluzby` zůstane funkční.
- Blog, portfolio, galerie, Focení 101, Light Tester a administrace mimo popsané rozšíření nejsou předmětem vizuálního redesignu.

## Architektura

Řešení použije společný základ a čtyři samostatné kompozice. Sdílené budou navigace, wordmark, kontaktní formulář, obrazová komponenta s placeholderem a datová vrstva administrace. Každá veřejná stránka dostane vlastní strukturu a lokálně omezené návrhové proměnné. Globální motiv a administrační nastavení zůstanou dostupné ostatním částem aplikace.

Stránky zůstanou serverově vykreslené, s reálnými URL a locale-aware odkazy. Redesign nepřevede web na klientský canvas ani na jedinou univerzální šablonu.

## Vizuální systém

### Homepage

- Slonovinová `#F4F1EA`, černá `#11100E`, červený akcent `#C93A2B`.
- Bodoni Moda pro výrazné titulky, Manrope pro navigaci a běžný text.
- Asymetrická editorialová kompozice, ve které hero fotografie a titul tvoří jeden celek.
- Pořadí: hero, vybraná tvorba a vstupy do služeb, fotograf, foto nástroje, kontakt.
- Na mobilu musí první fotografie začít v první obrazovce.

### Kreativní portrét

- Černá `#0A0A09`, měkká bílá `#EEEAE2`; barvu přinášejí fotografie.
- Bodoni Moda, velký hero portrét a nepravidelná výstavní sekvence.
- Výchozí titulek „Tvoje tvář. Jinak.“
- Stručný průběh, kontakt a přirozený odkaz na Focení 101.

### Business portrét

- Studená bílá `#F3F5F4`, inkoustová `#10201F`, zelenošedá `#536460`.
- Manrope, pravidelný grid a předvídatelné zarovnání.
- Výchozí titulek „Tvoje práce. Tvoje tvář.“
- Zachovat stávající ceny, podmínky, FAQ a poptávkovou cestu.

### Eventy a svatby

- Světlá `#F5F2EC`, černá `#0B0B0A`.
- Oswald pro výrazné titulky, Manrope pro informace.
- Výchozí editovatelný titulek „Až budete u toho.“
- Široké fotografie a reportážní rytmus, jasně viditelné svatby i eventy.
- Larp může být pouze vedlejší odkaz níže na stránce.

### Společné prvky

- Stejný wordmark, poloha navigace, jazykový přepínač a kontakt.
- Navigace přizpůsobí kontrast stránce a označí aktivní službu.
- Žádné univerzální karty, automatické slideshow, scroll-jacking ani pohyb podle kurzoru.
- Krátké prolnutí je přípustné až po dokončení statické kvality; `prefers-reduced-motion` ho vypne.

## Obsah a administrace

`SiteImages` se zpětně kompatibilně rozšíří o pojmenované obrazové sloty pro homepage, kreativní portrét, business a eventy se svatbami. Každý slot ponese Cloudinary public ID, alternativní text a ohnisko ořezu pro desktop a mobil. Prázdný slot zobrazí záměrný neutrální placeholder, nikdy AI fotografii vydávanou za portfolio.

Homepage a kreativní portrét použijí jako výchozí skutečné fotografie uvedené v `REDESIGN-PLAN.md`. Business a eventové sloty budou do doplnění autorských fotografií prázdné. V administraci půjdou všechny sloty vyměnit. Titulek eventové stránky bude editovatelný samostatně pro češtinu a angličtinu.

Starší KV záznamy bez nových polí se za běhu doplní výchozími hodnotami. Stávající ceny, texty, formulář, překlady a obrazová data se nesmí ztratit.

Náhledy Focení 101 a Light planneru budou statické, spravované obrazové sloty. Homepage nebude importovat jejich 3D aplikace. U Light planneru bude na mobilu viditelné upozornění na potřebu větší obrazovky.

## Přístupnost, SEO a chování

- Každá služba má jedinečný H1, title, description, canonical a jazykové alternativy.
- Nová eventová stránka se přidá do sitemap a interních odkazů.
- Navigace a odkazy fungují bez JavaScriptu; mobilní menu je ovladatelné klávesnicí a drží fokus.
- Fotografie mají rezervovaný poměr stran, vhodné `sizes`, alternativní text a priority pouze v hero.
- Kontrast, viditelný fokus a reduced motion budou ověřeny na všech motivech.
- Kontaktní formulář zůstane společný a předvolby balíčků zůstanou funkční.

## Ověření

- Screenshoty homepage a všech tří služeb v šířkách 1440, 1024, 768, 390 a 320 px.
- Porovnání prvních obrazovek i celých stránek s referencemi po načtení fontů a obrázků.
- Kontrola ořezů, přetečení, placeholderů, CS/EN, navigace, kontaktu a ukládání v administraci.
- `npx tsc --noEmit`, relevantní Vitest testy a produkční build.
- Zápis změny do `CHANGELOG.md` před commitem.

## Kritéria přijetí

1. Homepage odpovídá kompoziční silou schválenému editoriálu, nejen jeho barvami.
2. Kreativní portrét, business a eventy se svatbami jsou rozeznatelné bez čtení nadpisu.
3. Společná navigace, lokalizace, kontakt a spravovaný obsah fungují na všech stránkách.
4. Výchozí kreativní fotografie jsou skutečná autorská díla; chybějící business a eventové fotografie mají administračně nahraditelné placeholdery.
5. Foto nástroje mají lehké skutečné náhledy a nezatěžují homepage 3D runtime.
6. Web je přesvědčivý a použitelný bez animací na desktopu i telefonu.

