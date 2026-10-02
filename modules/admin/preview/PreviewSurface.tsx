"use client";

import { useEffect, useState } from "react";
import type { ContentData, NormalizedContentData, NormalizedSiteImages } from "@/modules/admin/lib/content";
import { normalizePageCopy } from "@/modules/admin/lib/page-copy";
import { BusinessEditorial } from "@/modules/editorial/components/BusinessEditorial";
import { EventsEditorial } from "@/modules/editorial/components/EventsEditorial";
import { HomeEditorial } from "@/modules/editorial/components/HomeEditorial";
import { PortraitEditorial } from "@/modules/editorial/components/PortraitEditorial";
import { findByText, type PreviewMessage, type PreviewPage } from "./protocol";

type Props = { page: PreviewPage; locale: string; content: NormalizedContentData; images: NormalizedSiteImages };

const mergeContent = (base: NormalizedContentData, draft: ContentData, locale: string): NormalizedContentData => ({
  ...base,
  home: draft.home ?? base.home,
  lightTesterPromo: draft.lightTesterPromo ?? base.lightTesterPromo,
  editorial: draft.editorial ?? base.editorial,
  sluzby: { ...base.sluzby, ...draft.sluzby, business: draft.sluzby?.business ?? base.sluzby.business },
  pages: normalizePageCopy(draft.pages, locale),
});

function highlight(element: Element | null) {
  if (!(element instanceof HTMLElement)) return;
  element.scrollIntoView({ block: "center", behavior: "smooth" });
  element.animate(
    [{ outline: "3px solid #f59e0b", outlineOffset: "4px" }, { outline: "3px solid transparent", outlineOffset: "4px" }],
    { duration: 1600, easing: "ease-out" },
  );
}

// Links and forms stay inert so the admin preview never navigates away or sends the contact form.
function blockInteraction(event: Event) {
  const target = event.target as Element | null;
  if (event.type === "submit" || target?.closest("a")) event.preventDefault();
}

export function PreviewSurface({ page, locale, content: initialContent, images: initialImages }: Props) {
  const [content, setContent] = useState(initialContent);
  const [images, setImages] = useState(initialImages);

  useEffect(() => {
    function onMessage(event: MessageEvent<PreviewMessage>) {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      const message = event.data;
      if (message.type === "preview:data") {
        if (message.content) setContent(mergeContent(initialContent, message.content, locale));
        if (message.editorial) setImages({ ...initialImages, editorial: message.editorial });
      }
      if (message.type === "preview:focus") highlight(document.querySelector(message.selector));
      if (message.type === "preview:find") highlight(findByText(document.body, message.text));
    }
    window.addEventListener("message", onMessage);
    document.addEventListener("click", blockInteraction, true);
    document.addEventListener("submit", blockInteraction, true);
    window.parent.postMessage({ type: "preview:ready" } satisfies PreviewMessage, window.location.origin);
    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("click", blockInteraction, true);
      document.removeEventListener("submit", blockInteraction, true);
    };
  }, [initialContent, initialImages, locale]);

  if (page === "home") return <HomeEditorial locale={locale} content={content} images={images} />;
  if (page === "portrety") return <PortraitEditorial locale={locale} content={content} images={images} />;
  if (page === "business") {
    return <BusinessEditorial locale={locale} copy={content.pages.business} business={content.sluzby.business} images={images} />;
  }
  return <EventsEditorial locale={locale} content={content} images={images} />;
}
