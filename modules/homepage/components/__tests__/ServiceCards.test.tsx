import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { ServiceCards } from "../ServiceCards";

it("renders a service badge only when set", () => {
  const html = renderToStaticMarkup(<ServiceCards selectLabel="" services={[
    { key: "a", category: "", title: "A", desc: "", packages: [], badge: "Připravujeme" },
    { key: "b", category: "", title: "B", desc: "", packages: [] },
  ]} />);
  expect(html.match(/Připravujeme/g)).toHaveLength(1);
});
