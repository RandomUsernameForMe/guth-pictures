import type { PropsWithChildren } from "react";
import { EditorialNav, type ActivePage } from "./EditorialNav";

type Props = PropsWithChildren<{
  active: Extract<ActivePage, "services" | "portfolio" | "about" | "blog" | "legal">;
  className?: string;
}>;

export function EditorialSubpage({ active, className = "", children }: Props) {
  return (
    <main className={`editorial-secondary ${className}`.trim()}>
      <EditorialNav tone="light" active={active} />
      {children}
    </main>
  );
}
