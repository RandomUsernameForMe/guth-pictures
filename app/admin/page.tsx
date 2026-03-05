import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getGalleryPhotos } from "@/lib/cloudinary";
import { AdminDashboard } from "@/components/AdminDashboard";

export default async function AdminPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  const photos = await getGalleryPhotos();

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-bold">Admin — Guth Pictures</h1>
        <form action="/api/admin/logout" method="POST">
          <button className="text-sm text-gray-400 hover:text-white transition-colors">
            Odhlásit
          </button>
        </form>
      </div>
      <AdminDashboard photos={photos} />
    </main>
  );
}
