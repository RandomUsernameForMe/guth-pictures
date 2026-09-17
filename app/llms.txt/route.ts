import { siteUrl } from "@/lib/config";
import { getContactEmail } from "@/modules/admin/lib/content";

export const revalidate = 3600;

export async function GET() {
  const email = await getContactEmail();

  const text = `# Guth Pictures

> Tomáš Guth Jarkovský, profesionální fotograf v Praze. Kreativní portréty se silnou atmosférou, svatební fotografie, eventy a larpy. Focení v ateliéru i exteriéru, po celé České republice.

> Tomáš Guth Jarkovský, professional photographer in Prague, Czech Republic. Creative portraits with strong atmosphere, wedding photography, events and larps. Studio and outdoor shoots across the Czech Republic.

Kontakt / Contact: ${email}
Instagram: https://www.instagram.com/guth_pictures/

## Služby / Services

- Portrétní focení (individuální i skupinové, ateliér / exteriér) — Portrait sessions
- Svatební fotografie (celodenní reportáž) — Wedding photography
- Eventy a larpy — Events & larp photography

Ceník a balíčky: ${siteUrl}/cs/sluzby

## Stránky / Pages

- [Domů / Home](${siteUrl}/cs)
- [Portfolio](${siteUrl}/cs/portfolio)
- [Služby / Services](${siteUrl}/cs/sluzby)
- [O mně / About](${siteUrl}/cs/o-mne)
- [Blog](${siteUrl}/cs/blog), RSS: ${siteUrl}/feed.xml
- [Focení 101](${siteUrl}/cs/foceni-101): interaktivní průvodce, co dělá fotku (clona, čas, ISO, ohnisko)
- [Obchodní podmínky](${siteUrl}/cs/vop)

English versions live under ${siteUrl}/en/…
`;

  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
