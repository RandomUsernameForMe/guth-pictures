"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ContentData, EditorialImages } from "@/modules/admin/lib/content";
import { PREVIEW_PAGES, type PreviewMessage, type PreviewPage } from "./protocol";

export type PreviewFocus = { selector: string } | { text: string };
type Locale = "cs" | "en";

const DEVICES = { desktop: 1280, mobile: 390 } as const;
type Device = keyof typeof DEVICES;

// Editor + preview side by side; on lg+ the split breaks out of the narrow admin column.
export const SPLIT_LAYOUT =
  "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8 lg:items-start lg:w-[min(96vw,1800px)] lg:ml-[calc(50%_-_min(48vw,900px))]";

const tab = (active: boolean) =>
  `px-2.5 py-1 text-xs border transition-colors ${active ? "bg-white text-black border-white" : "border-white/20 text-gray-300 hover:border-white/50"}`;

type Props = {
  page: PreviewPage;
  onPageChange: (page: PreviewPage) => void;
  locale: Locale;
  onLocaleChange?: (locale: Locale) => void;
  content?: ContentData;
  editorial?: EditorialImages;
  focus?: PreviewFocus | null;
};

export function AdminPreview({ page, onPageChange, locale, onLocaleChange, content, editorial, focus }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [open, setOpen] = useState(false);
  const src = `/${locale}/nahled/${page}`;

  const post = useCallback((message: PreviewMessage) => {
    iframeRef.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent<PreviewMessage>) {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type === "preview:ready") setReady(true);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    setReady(false);
    setFailed(false);
    const timer = setTimeout(() => setFailed(true), 8000);
    return () => clearTimeout(timer);
  }, [src, reloadKey]);

  useEffect(() => {
    if (ready) post({ type: "preview:data", content, editorial });
  }, [ready, content, editorial, post]);

  useEffect(() => {
    if (ready && focus) post("selector" in focus ? { type: "preview:focus", selector: focus.selector } : { type: "preview:find", text: focus.text });
  }, [ready, focus, post]);

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const width = DEVICES[device];
  const scale = size.width ? Math.min(1, size.width / width) : 1;

  return <>
    <button type="button" onClick={() => setOpen(true)} className="lg:hidden fixed bottom-4 right-4 z-40 px-4 py-2 bg-white text-black text-sm font-medium shadow-lg">
      Zobrazit náhled
    </button>
    <aside
      aria-label="Živý náhled stránky"
      className={`${open ? "fixed inset-0 z-50 flex p-3 bg-zinc-950" : "hidden"} lg:flex lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] flex-col gap-2`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {(Object.keys(PREVIEW_PAGES) as PreviewPage[]).map((key) => (
          <button key={key} type="button" aria-pressed={page === key} onClick={() => onPageChange(key)} className={tab(page === key)}>{PREVIEW_PAGES[key]}</button>
        ))}
        <span className="mx-1 h-4 w-px bg-white/15" />
        {(Object.keys(DEVICES) as Device[]).map((key) => (
          <button key={key} type="button" aria-pressed={device === key} onClick={() => setDevice(key)} className={tab(device === key)}>{key === "desktop" ? "Desktop" : "Mobil"}</button>
        ))}
        {onLocaleChange && <>
          <span className="mx-1 h-4 w-px bg-white/15" />
          {(["cs", "en"] as Locale[]).map((key) => (
            <button key={key} type="button" aria-pressed={locale === key} onClick={() => onLocaleChange(key)} className={tab(locale === key)}>{key.toUpperCase()}</button>
          ))}
        </>}
        <span className="ml-auto text-[11px] text-gray-500">neuložené změny se ukazují hned</span>
        {open && <button type="button" onClick={() => setOpen(false)} className="lg:hidden ml-2 text-sm underline">Zavřít</button>}
      </div>
      <div ref={frameRef} className="relative flex-1 min-h-0 overflow-hidden border border-white/10 bg-zinc-900 flex justify-center">
        {size.width > 0 && <iframe
          key={reloadKey}
          ref={iframeRef}
          src={src}
          title={`Náhled: ${PREVIEW_PAGES[page]}`}
          style={{ width, height: size.height / scale, transform: `scale(${scale})`, transformOrigin: "top center", flex: "none" }}
          className="bg-white border-0"
        />}
        {!ready && failed && <div role="alert" className="absolute inset-0 grid place-content-center gap-3 bg-zinc-950/90 text-sm text-center">
          <p>Náhled se nenačetl.</p>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="underline">Načíst znovu</button>
        </div>}
      </div>
    </aside>
  </>;
}
