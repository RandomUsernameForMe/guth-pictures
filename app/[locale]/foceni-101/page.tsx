import type { Metadata } from "next";
import { Foceni101App } from "@/modules/foceni-101/components/Foceni101App";

export const metadata: Metadata = {
  title: "Focení 101 — co dělá fotku | Guth Pictures",
  description:
    "Interaktivní průvodce pro nefotografy. Posuň posuvník a uvidíš, co clona, čas závěrky, ISO a ohnisko udělají s fotkou. Žádný žargon.",
};

export default function Foceni101Page() {
  return <Foceni101App />;
}
