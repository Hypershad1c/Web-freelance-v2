import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { BlogPostForm } from "@/components/admin/BlogPostForm";
import { createPost } from "@/lib/actions/blog";

export default async function NewBlogPostPage() {
  const categories = await prisma.blogCategory.findMany({ orderBy: { name: "asc" } });
  return (
    <>
      <AdminTopbar title="Nouvel article" />
      <div className="p-6 lg:p-10">
        <BlogPostForm action={createPost} categories={categories} submitLabel="Créer l'article" />
      </div>
    </>
  );
}
