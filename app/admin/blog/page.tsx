import { AdminShell } from "@/modules/admin/components/AdminShell";
import { BlogEditor } from "@/modules/admin/components/BlogEditor";

export default function BlogPage() {
  return (
    <AdminShell>
      <BlogEditor />
    </AdminShell>
  );
}
