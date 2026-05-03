import type { Metadata } from "next";
import { LightTesterApp } from "@/modules/light-tester/components/LightTesterApp";

export const metadata: Metadata = {
  title: "Light Tester — Guth Pictures",
  description: "Interaktivní simulátor studiového osvětlení. Zkus různá světelná schémata a nastav světla pro svůj portrét.",
  robots: { index: false },
};

export default function LightTesterPage() {
  return (
    <div className="lt-page">
      <LightTesterApp />
    </div>
  );
}
