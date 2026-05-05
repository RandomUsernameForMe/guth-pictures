import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const locale = await getLocale();
  const cs = locale === "cs";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <p className="text-7xl font-bold text-[var(--color-text-ghost)]">404</p>
      <h1 className="text-2xl font-semibold">
        {cs ? "Stránka nenalezena" : "Page not found"}
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] max-w-sm text-center">
        {cs
          ? "Stránka, kterou hledáš, neexistuje nebo byla přesunuta."
          : "The page you're looking for doesn't exist or has been moved."}
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
      >
        {cs ? "Zpět na úvod" : "Back to home"}
      </Link>
    </main>
  );
}
