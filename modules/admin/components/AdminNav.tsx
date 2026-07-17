"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/fotky", label: "Fotky" },
  { href: "/admin/obsah", label: "Obsah" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/tema", label: "Téma" },
  { href: "/admin/galerie", label: "Galerie" },
  { href: "/admin/navrhy", label: "Návrhy" },
  { href: "/admin/stories", label: "Stories" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      {tabs.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-white text-black"
                : "text-gray-400 hover:text-white border border-white/10 hover:border-white/30"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
