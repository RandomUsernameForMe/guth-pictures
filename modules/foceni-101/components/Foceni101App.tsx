"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { StudioScene } from "./StudioScene";
import { ExposureMeter } from "./ExposureMeter";
import { buildSections } from "./sections";
import { DEFAULT_PARAMS, type PhotoParams, type Section } from "./types";
import { holdExposureFor, computeLight } from "./light";
import { Capstone } from "./Capstone";
import { CAPSTONES, capstoneExposure, type CapVals } from "./capstones";
import { CompositionPicker } from "./CompositionPicker";
import { CompositionOverlay } from "./CompositionOverlay";
import { COMPOSITIONS, subjectScreenX } from "./compositions";
import { ContactForm } from "@/components/ContactForm";

type Quality = "high" | "low";

function initialSliderVals(sections: Section[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of sections) {
    if (s.control) {
      out[s.id] = s.target[s.control.param] ?? DEFAULT_PARAMS[s.control.param];
    }
  }
  return out;
}

export function Foceni101App() {
  const t = useTranslations("foceni101");
  const sections = useMemo(() => buildSections(t), [t]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sliderVals, setSliderVals] = useState<Record<string, number>>(() =>
    initialSliderVals(sections),
  );
  const [quality, setQuality] = useState<Quality>("high");
  const [orbLightOn, setOrbLightOn] = useState(true);
  const [capVals, setCapVals] = useState<Record<string, CapVals>>(() =>
    Object.fromEntries(Object.entries(CAPSTONES).map(([id, m]) => [id, { ...m.init }])),
  );
  const [compSel, setCompSel] = useState(0);
  const [compHover, setCompHover] = useState<number | null>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // Lower the 3D quality on small / coarse-pointer devices (still fully usable).
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const apply = () => setQuality(mq.matches ? "low" : "high");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Active section = the one crossing the viewport centre.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = sectionRefs.current.indexOf(e.target as HTMLElement);
            if (idx >= 0) setActiveIndex(idx);
          }
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    sectionRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  // Params the scene tweens to: each section starts from a neutral baseline,
  // applies its own tweak, then the user's slider override (if any).
  const target = useMemo<PhotoParams>(() => {
    const sec = sections[activeIndex];
    const base: PhotoParams = { ...DEFAULT_PARAMS, ...sec.target };
    if (sec.capstone) {
      // One leg held in a narrow range by the scenario's goal; the other two
      // are free. Exposure pinned so the scenario's ref balances — the user
      // trades the two free legs to cancel the light error.
      const m = CAPSTONES[sec.id];
      const v = capVals[sec.id];
      base.aperture = v.aperture;
      base.shutter = v.shutter;
      base.iso = v.iso;
      base.exposure = capstoneExposure(m);
      return base;
    }
    if (sec.composition) {
      const cmp = COMPOSITIONS[compHover ?? compSel];
      base.composition = cmp.comp;
      base.framing = cmp.framing;
      return base;
    }
    if (sec.control) base[sec.control.param] = sliderVals[sec.id];
    // Isolated sections: cancel the side-effect on brightness so only the
    // taught effect (blur / trail / grain) shows. Reveal & capstone skip this.
    if (sec.holdLight) base.exposure = holdExposureFor(base);
    return base;
  }, [sections, activeIndex, sliderVals, capVals, compSel, compHover]);

  const capSolved =
    !!sections[activeIndex]?.capstone && Math.abs(computeLight(target).evDelta) < 0.3;
  // The orbiter only appears where it teaches something (shutter + capstones);
  // elsewhere it would just be a glowing ball floating over a portrait.
  const orbAllowed = !!sections[activeIndex]?.orb;

  return (
    <div className="f101">
      <div className="f101-stage">
        <StudioScene target={target} quality={quality} orbLightOn={orbAllowed && orbLightOn} />
        <ExposureMeter params={target} show={!!sections[activeIndex]?.meter} />
        {orbAllowed && (
          <button
            type="button"
            className="f101-toggle"
            aria-pressed={orbLightOn}
            onClick={() => setOrbLightOn((v) => !v)}
          >
            {orbLightOn ? t("orbOn") : t("orbOff")}
          </button>
        )}
        <CompositionOverlay
          kind={COMPOSITIONS[compHover ?? compSel].overlay}
          subjectX={subjectScreenX(COMPOSITIONS[compHover ?? compSel].comp)}
          show={sections[activeIndex]?.composition === true}
        />
        <div className="f101-progress">
          {sections.map((s, i) => (
            <span key={s.id} className={`f101-dot${i === activeIndex ? " f101-dot--on" : ""}`} />
          ))}
        </div>
      </div>

      <div className="f101-sections">
        {sections.map((s, i) => {
          const c = s.control;
          const val = c ? sliderVals[s.id] : 0;
          const pct = c ? ((val - c.min) / (c.max - c.min)) * 100 : 0;
          return (
            <section
              key={s.id}
              ref={(el) => { sectionRefs.current[i] = el; }}
              className="f101-section"
            >
              {s.capstone ? (
                <Capstone
                  num={s.num}
                  title={s.title}
                  body={s.body}
                  sectionId={s.id}
                  scenario={CAPSTONES[s.id]}
                  vals={capVals[s.id]}
                  onChange={(v) => setCapVals((p) => ({ ...p, [s.id]: v }))}
                  solved={i === activeIndex && capSolved}
                  active={i === activeIndex}
                />
              ) : s.composition ? (
                <CompositionPicker
                  num={s.num}
                  title={s.title}
                  intro={s.body}
                  selected={compSel}
                  onSelect={setCompSel}
                  onHover={setCompHover}
                  active={i === activeIndex}
                />
              ) : s.cta ? (
                <div className={`f101-card f101-card--cta${i === activeIndex ? " f101-card--active" : ""}`}>
                  <div className="f101-card-num">{s.num}</div>
                  <h2 className="f101-card-title">{s.title}</h2>
                  <p className="f101-card-body">{s.body}</p>
                  <div className="f101-cta-form">
                    <ContactForm />
                  </div>
                </div>
              ) : (
                <div className={`f101-card${i === activeIndex ? " f101-card--active" : ""}`}>
                  <div className="f101-card-num">{s.num}</div>
                  <h2 className="f101-card-title">{s.title}</h2>
                  <p className="f101-card-body">{s.body}</p>

                  {c && (
                    <div className="f101-ctrl">
                      <div className="f101-ctrl-row">
                        <span>{c.label}</span>
                        <span className="f101-ctrl-val">{c.fmt(val)}</span>
                      </div>
                      <input
                        type="range"
                        className="gp-slider"
                        aria-label={c.label}
                        min={c.min}
                        max={c.max}
                        step={c.step}
                        value={val}
                        style={{
                          ["--p" as string]: `${c.invert ? 100 - pct : pct}%`,
                          direction: c.invert ? "rtl" : undefined,
                        }}
                        onChange={(e) =>
                          setSliderVals((v) => ({ ...v, [s.id]: parseFloat(e.target.value) }))
                        }
                      />
                    </div>
                  )}

                  {i === 0 && <div className="f101-scroll-hint">{t("scrollHint")}</div>}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
