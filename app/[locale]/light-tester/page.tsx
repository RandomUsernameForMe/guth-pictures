import type { Metadata } from "next";
import { LightTesterApp } from "@/modules/light-tester/components/LightTesterApp";

export const metadata: Metadata = {
  title: "Light Tester",
  description: "Interaktivní simulátor studiového osvětlení. Zkus různá světelná schémata a nastav světla pro svůj portrét.",
  robots: { index: false },
};

export default function LightTesterPage() {
  return (
    <div className="lt-page">
      <div className="lt-mobile-unavailable">
        <p>Light Tester není dostupný na mobilních zařízeních a malých obrazovkách.</p>
        <p>Otevři ho na počítači.</p>
      </div>
      <div className="lt-desktop-only">
        <LightTesterApp />
      </div>
    </div>
  );
}
