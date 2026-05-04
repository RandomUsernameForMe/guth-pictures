import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { AdminNav } from "./AdminNav";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  if (!(await isAuthenticated())) redirect("/admin/login");

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="text-2xl font-bold hover:opacity-70 transition-opacity">
          Admin — Guth Pictures
        </Link>
        <form action="/api/admin/logout" method="POST">
          <button className="text-sm text-gray-400 hover:text-white transition-colors">
            Odhlásit
          </button>
        </form>
      </div>
      <AdminNav />
      <div className="mt-10">{children}</div>
    </div>
  );
}
