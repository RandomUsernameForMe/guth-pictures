import { getTranslations } from "next-intl/server";
import { cloudinaryUrl } from "@/lib/cloudinary-utils";
import { paletteToAmbient } from "@/modules/brand-shoot/lib/palette-theme";
import type { ProposalPublic, ProposalConcept, ProposalImage } from "@/modules/brand-shoot/lib/types";
import { LivingPalette } from "./LivingPalette";
import { ProposalGallery } from "./ProposalGallery";

const FALLBACK = {
  accent: "#C8A96E", glowA: "#2A1C12", glowB: "#15110D", tint: "#0A0A0B",
  duoShadow: "#3A2A1A", duoLight: "#E8DFCF",
};

// Build the `data-pal-*` attribute bag a section/button needs for the living-palette scroll-spy.
function palData(name: string, colors: string[]) {
  const amb = paletteToAmbient(colors) ?? FALLBACK;
  return {
    "data-pal": "",
    "data-pal-accent": amb.accent,
    "data-pal-glowa": amb.glowA,
    "data-pal-glowb": amb.glowB,
    "data-pal-tint": amb.tint,
    "data-pal-duoa": amb.duoShadow,
    "data-pal-duob": amb.duoLight,
    "data-pal-name": name,
    "data-pal-sw": colors.join(","),
  } as const;
}

function img(id: string, w: number) {
  return cloudinaryUrl(id, `c_fill,w_${w},q_auto,f_auto`);
}

function ConceptSection({
  concept,
  index,
  hero,
  mood,
  labels,
}: {
  concept: ProposalConcept;
  index: number;
  hero?: ImageT;
  mood: ImageT[];
  labels: Record<string, string>;
}) {
  // One palette per concept (admin-chosen); falls back to the first available.
  const chosen = concept.palettes.find((p) => p.id === concept.chosenPaletteId) ?? concept.palettes[0];
  const pal = chosen ? palData(chosen.name, chosen.colors) : palData(concept.title, []);
  const no = String(index + 1).padStart(2, "0");

  const rows = [
    [labels.mood, concept.mood],
    [labels.wardrobe, concept.wardrobe],
    [labels.location, concept.location],
    [labels.lighting, concept.lighting],
    [labels.poses, concept.poseDirection],
  ].filter(([, v]) => v);

  return (
    <section className="bsp-ed-concept" {...pal}>
      <span className="bsp-ed-concept-num" aria-hidden>{no}</span>
      <div className="bsp-ed-concept-inner" data-reveal>
        <figure className="bsp-ed-portrait">
          {hero ? (
            <div className="bsp-ed-portrait-wrap">
              <img className="bsp-ed-portrait-img" src={img(hero.cloudinaryId, 1100)} alt={hero.note ?? concept.title} />
            </div>
          ) : (
            <div className="bsp-ed-portrait-ph" aria-hidden />
          )}
        </figure>

        <div className="bsp-ed-concept-text">
          <div className="bsp-ed-eyebrow bsp-ed-concept-eyebrow">
            <span>{labels.conceptWord} № {no}</span>
            <span className="bsp-ed-rule" aria-hidden />
          </div>
          <h2 className="bsp-ed-display">{concept.title}</h2>
          {concept.pitch && <p className="bsp-ed-concept-pitch">{concept.pitch}</p>}
          {concept.why && <p className="bsp-ed-lead">{concept.why}</p>}

          {rows.length > 0 && (
            <dl className="bsp-ed-spec">
              {rows.map(([label, value]) => (
                <div key={label} className="bsp-ed-spec-row">
                  <dt className="gp-label">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {mood.length > 0 && (
        <div className="bsp-ed-mood" data-reveal>
          {mood.map((m) => (
            <figure key={m.cloudinaryId} className="bsp-ed-mood-fig">
              <img src={img(m.cloudinaryId, 700)} alt={m.note ?? ""} loading="lazy" />
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}

type ImageT = ProposalImage;

export async function ProposalView({ proposal }: { proposal: ProposalPublic }) {
  const t = await getTranslations({ locale: proposal.locale, namespace: "brand-shoot" });
  const labels = {
    mood: t("conceptMood"),
    wardrobe: t("conceptWardrobe"),
    location: t("conceptLocation"),
    lighting: t("conceptLighting"),
    poses: t("conceptPoses"),
    conceptWord: t("conceptWord"),
  };

  const concepts = proposal.concepts;
  const heroOf = (id: string) =>
    proposal.moodboard.find((i) => i.concept === id && i.hero) ??
    proposal.moodboard.find((i) => i.concept === id);
  // Per-concept image set: that concept's non-hero moodboard refs + its poses (merged, capped).
  const imagesOf = (id: string) =>
    [
      ...proposal.moodboard.filter((i) => i.concept === id && !i.hero),
      ...proposal.poses.filter((i) => i.concept === id),
    ].slice(0, 8);

  // Brand/opening palette = first concept's first palette (fallback to neutral).
  const brandPalette = concepts.find((c) => c.palettes.length > 0)?.palettes[0];
  const brandPal = brandPalette ? palData(brandPalette.name, brandPalette.colors) : palData("Úvod", []);
  const initial = (brandPalette && paletteToAmbient(brandPalette.colors)) || FALLBACK;

  // Any poses NOT assigned to a concept fall back to a shared gallery at the end.
  const sharedPoses = proposal.poses.filter((i) => !i.concept);
  const intro = proposal.intro?.trim();

  return (
    <LivingPalette initial={initial} resetLabel={t("paletteToggleLabel")}>
      <div className="bsp-ed-wordmark" aria-hidden>
        Guth Pictures
      </div>

      {/* OPENING */}
      <section className="bsp-ed-opening" {...brandPal}>
        <div className="bsp-ed-opening-inner" data-reveal>
          <div className="bsp-ed-eyebrow">
            <span className="bsp-ed-eyebrow-accent">{t("heroLabel")}</span>
          </div>
          <p className="bsp-ed-kicker">{t("heroPreparedFor")}</p>
          <h1 className="bsp-ed-name">{proposal.name}</h1>
          {proposal.summary && <p className="bsp-ed-intro">{proposal.summary}</p>}
        </div>
        <div className="bsp-ed-scrollcue" aria-hidden>
          <span className="bsp-ed-arrow">↓</span>
          <span>{t("scrollHint")}</span>
        </div>
      </section>

      {/* WHO YOU ARE */}
      {intro && (
        <section className="bsp-ed-intro-sec" {...brandPal}>
          <div className="bsp-ed-intro-inner" data-reveal>
            <span className="gp-label bsp-ed-eyebrow-accent">{t("whoYouAreKicker")}</span>
            <h2 className="bsp-ed-intro-h">{t("whoYouAreTitle")}</h2>
            {intro.split(/\n{2,}/).map((para, i) =>
              para.trim().startsWith(">") ? (
                <blockquote key={i} className="bsp-ed-quote">
                  {para.replace(/^>\s?/gm, "").trim()}
                </blockquote>
              ) : (
                <p key={i} className="bsp-ed-intro-p">
                  {para.trim()}
                </p>
              )
            )}
          </div>
        </section>
      )}

      {/* CONCEPTS */}
      {concepts.map((c, i) => (
        <ConceptSection key={c.id} concept={c} index={i} hero={heroOf(c.id)} mood={imagesOf(c.id)} labels={labels} />
      ))}

      {/* SHARED POSES */}
      {sharedPoses.length > 0 && (
        <section className="bsp-ed-poses" {...brandPal}>
          <div className="bsp-ed-poses-inner" data-reveal>
            <span className="gp-label">{t("posesTitle")}</span>
            <ProposalGallery images={sharedPoses} />
          </div>
        </section>
      )}

      {/* CLOSE */}
      <section className="bsp-ed-close" {...brandPal}>
        <div className="bsp-ed-close-inner" data-reveal>
          <span className="bsp-ed-eyebrow-accent">{t("ctaTitle")}</span>
          <h2 className="bsp-ed-close-h">{t("ctaBody")}</h2>
          <a className="bsp-ed-cta" href={`mailto:ahoj@guthpictures.eu?subject=${encodeURIComponent(`Návrh focení — ${proposal.name}`)}`}>
            {t("ctaButton")} →
          </a>
        </div>
      </section>
    </LivingPalette>
  );
}
