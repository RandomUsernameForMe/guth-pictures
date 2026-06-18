import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cloudinaryUrl } from "@/lib/cloudinary-utils";
import type { ProposalPublic, ProposalConcept } from "@/modules/brand-shoot/lib/types";
import { ProposalGallery } from "./ProposalGallery";
import { ProposalThemer } from "./ProposalThemer";

function ConceptBlock({
  concept,
  labels,
}: {
  concept: ProposalConcept;
  labels: { mood: string; wardrobe: string; location: string; lighting: string; shotList: string; poses: string };
}) {
  const rows: { label: string; value: string }[] = [
    { label: labels.mood, value: concept.mood },
    { label: labels.wardrobe, value: concept.wardrobe },
    { label: labels.location, value: concept.location },
    { label: labels.lighting, value: concept.lighting },
    { label: labels.poses, value: concept.poseDirection },
  ].filter((r) => r.value);

  return (
    <article className="bsp-concept">
      <header className="bsp-concept-head">
        <span className="gp-label">{concept.id}</span>
        <h3 className="gp-h2">{concept.title}</h3>
        {concept.pitch && <p className="gp-subtitle">{concept.pitch}</p>}
      </header>

      {concept.palette.length > 0 && (
        <div className="bsp-palette" aria-hidden>
          {concept.palette.map((hex) => (
            <span key={hex} className="bsp-swatch" style={{ background: hex }} title={hex} />
          ))}
        </div>
      )}

      {concept.why && <p className="bsp-concept-why gp-body-md">{concept.why}</p>}

      {rows.length > 0 && (
        <dl className="bsp-spec">
          {rows.map((r) => (
            <div key={r.label} className="bsp-spec-row">
              <dt className="gp-label">{r.label}</dt>
              <dd className="gp-body-md">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {concept.shotList.length > 0 && (
        <div className="bsp-shotlist">
          <p className="gp-label">{labels.shotList}</p>
          <ul>
            {concept.shotList.map((s, i) => (
              <li key={i} className="gp-body-md">{s}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export async function ProposalView({ proposal }: { proposal: ProposalPublic }) {
  const t = await getTranslations({ locale: proposal.locale, namespace: "brand-shoot" });
  const cover = proposal.coverImageId ?? proposal.moodboard[0]?.cloudinaryId;

  const conceptLabels = {
    mood: t("conceptMood"),
    wardrobe: t("conceptWardrobe"),
    location: t("conceptLocation"),
    lighting: t("conceptLighting"),
    shotList: t("conceptShotList"),
    poses: t("conceptPoses"),
  };

  return (
    <ProposalThemer palettes={proposal.palettes}>
      <header className="bsp-hero">
        {cover && (
          <Image
            src={cloudinaryUrl(cover, "c_fill,w_1920,h_1080,q_auto,f_auto")}
            alt=""
            fill
            priority
            className="bsp-hero-img"
            sizes="100vw"
          />
        )}
        <div className="bsp-hero-overlay">
          <p className="gp-label">{t("heroLabel")}</p>
          <h1 className="gp-h1">{proposal.name}</h1>
        </div>
      </header>

      <div className="bsp-body">
        {proposal.concepts.length > 0 && (
          <section className="bsp-section">
            <h2 className="gp-h2">{t("conceptsTitle")}</h2>
            <div className="bsp-concepts">
              {proposal.concepts.map((c) => (
                <ConceptBlock key={c.id} concept={c} labels={conceptLabels} />
              ))}
            </div>
          </section>
        )}

        {proposal.moodboard.length > 0 && (
          <section className="bsp-section">
            <h2 className="gp-h2">{t("moodboardTitle")}</h2>
            <ProposalGallery images={proposal.moodboard} />
          </section>
        )}

        {proposal.poses.length > 0 && (
          <section className="bsp-section">
            <h2 className="gp-h2">{t("posesTitle")}</h2>
            <ProposalGallery images={proposal.poses} />
          </section>
        )}

        <section className="bsp-cta">
          <h2 className="gp-h2">{t("ctaTitle")}</h2>
          <p className="gp-subtitle">{t("ctaBody")}</p>
          <Link href="/#kontakt" className="bsp-btn-primary">
            {t("ctaButton")}
          </Link>
        </section>
      </div>
    </ProposalThemer>
  );
}
