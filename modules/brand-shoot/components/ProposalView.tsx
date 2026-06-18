import { getTranslations } from "next-intl/server";
import { cloudinaryUrl } from "@/lib/cloudinary-utils";
import { paletteToAmbient } from "@/modules/brand-shoot/lib/palette-theme";
import type { ProposalPublic, ProposalConcept, ProposalImage, ProposalPalette } from "@/modules/brand-shoot/lib/types";
import { LivingPalette } from "./LivingPalette";
import { ProposalGallery } from "./ProposalGallery";

const FALLBACK = { accent: "#C8A96E", glowA: "#2A1C12", glowB: "#15110D", tint: "#0A0A0B" };

// Build the `data-pal-*` attribute bag a section/button needs for the living-palette scroll-spy.
function palData(name: string, colors: string[]) {
  const amb = paletteToAmbient(colors) ?? FALLBACK;
  return {
    "data-pal": "",
    "data-pal-accent": amb.accent,
    "data-pal-glowa": amb.glowA,
    "data-pal-glowb": amb.glowB,
    "data-pal-tint": amb.tint,
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
  const primary = concept.palettes[0];
  const pal = primary ? palData(primary.name, primary.colors) : palData(concept.title, []);
  const no = String(index + 1).padStart(3, "0");

  const rows = [
    [labels.mood, concept.mood],
    [labels.wardrobe, concept.wardrobe],
    [labels.location, concept.location],
    [labels.lighting, concept.lighting],
    [labels.poses, concept.poseDirection],
  ].filter(([, v]) => v);

  return (
    <section className="bsp-ed-concept" {...pal}>
      <div className="bsp-ed-stage" data-reveal>
        {hero ? (
          <img className="bsp-ed-stage-img" src={img(hero.cloudinaryId, 1600)} alt={hero.note ?? concept.title} />
        ) : (
          <div className="bsp-ed-stage-ph" aria-hidden />
        )}
        <div className="bsp-ed-stage-scrim" aria-hidden />
        <header className="bsp-ed-stage-head">
          <div className="bsp-ed-eyebrow">
            <span>Koncept № {no}</span>
            <span className="bsp-ed-rule" aria-hidden />
            <span className="bsp-ed-eyebrow-muted">{primary?.name ?? concept.title}</span>
          </div>
          <h2 className="bsp-ed-display">{concept.title}</h2>
          {concept.pitch && <p className="bsp-ed-stage-pitch">{concept.pitch}</p>}
        </header>
      </div>

      <div className="bsp-ed-concept-body" data-reveal>
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

        {mood.length > 0 && (
          <div className="bsp-ed-mood">
            {mood.map((m) => (
              <figure key={m.cloudinaryId} className="bsp-ed-mood-fig">
                <img src={img(m.cloudinaryId, 700)} alt={m.note ?? ""} loading="lazy" />
              </figure>
            ))}
          </div>
        )}

        <div className="bsp-ed-palrow">
          <span className="gp-label bsp-ed-palrow-label">{labels.palette}</span>
          <div className="bsp-ed-palbtns">
            {concept.palettes.map((p: ProposalPalette, i: number) => (
              <button
                key={p.id}
                type="button"
                className="bsp-ed-select"
                data-select=""
                data-active="false"
                aria-label={`${labels.palette} ${i + 1}`}
                {...palData(p.name, p.colors)}
              >
                <span className="bsp-ed-swatches" aria-hidden>
                  {p.colors.slice(0, 5).map((c, j) => (
                    <span key={j} style={{ background: c }} />
                  ))}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
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
    palette: t("paletteToggleLabel"),
  };

  const concepts = proposal.concepts;
  const heroOf = (id: string) =>
    proposal.moodboard.find((i) => i.concept === id && i.hero) ??
    proposal.moodboard.find((i) => i.concept === id);
  const moodOf = (id: string) => proposal.moodboard.filter((i) => i.concept === id && !i.hero).slice(0, 3);

  // Brand/opening palette = first concept's first palette (fallback to neutral).
  const brandPalette = concepts.find((c) => c.palettes.length > 0)?.palettes[0];
  const brandPal = brandPalette ? palData(brandPalette.name, brandPalette.colors) : palData("Úvod", []);
  const initial = (brandPalette && paletteToAmbient(brandPalette.colors)) || FALLBACK;

  // Poses stay a shared gallery (not concept-scoped).
  const sharedPoses = proposal.poses;

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

      {/* CONCEPTS */}
      {concepts.map((c, i) => (
        <ConceptSection key={c.id} concept={c} index={i} hero={heroOf(c.id)} mood={moodOf(c.id)} labels={labels} />
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
          <div className="bsp-ed-choice">
            <span>{t("yourPalette")}</span>
            <span data-pal-swatches className="bsp-ed-choice-sw" aria-hidden />
            <a href="#" data-reset-pal className="bsp-ed-reset" style={{ display: "none" }}>
              ({t("resetPalette")})
            </a>
          </div>
          <a className="bsp-ed-cta" href={`mailto:ahoj@guthpictures.eu?subject=${encodeURIComponent(`Návrh focení — ${proposal.name}`)}`}>
            {t("ctaButton")} →
          </a>
        </div>
      </section>
    </LivingPalette>
  );
}
