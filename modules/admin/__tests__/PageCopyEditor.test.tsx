import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { PageCopyEditor } from "../components/PageCopyEditor";
import { defaultPageCopy } from "../lib/page-copy";

it("renders every editable text of a page including list items", () => {
  const template = defaultPageCopy("cs").business;
  const value = { ...template, heroTitle: "Upravený nadpis" };
  const html = renderToStaticMarkup(<PageCopyEditor name="business" value={value} template={template} onChange={() => {}} />);
  expect(html).toContain("Upravený nadpis");
  expect(html).toContain(template.faq[0].q);
  expect(html).toContain("Odpověď");
  expect(html).toContain("+ Přidat");
  expect(html).not.toContain(template.extrasTitle);
});
