import { AdminShell } from "@/components/admin/AdminShell";
import { BlogEditor } from "@/components/admin/BlogEditor";

export default function BlogPage() {
  return (
    <AdminShell>
      <BlogEditor />
    </AdminShell>
  );
}
