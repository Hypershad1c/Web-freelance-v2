import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { BlogPostForm } from "@/components/admin/BlogPostForm";
import { updatePost } from "@/lib/actions/blog";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, categories] = await Promise.all([
    prisma.blogPost.findUnique({ where: { id } }),
    prisma.blogCategory.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!post) notFound();

  const updateWithId = updatePost.bind(null, id);

  return (
    <>
      <AdminTopbar title={`Modifier — ${post.title}`} />
      <div className="p-6 lg:p-10">
        <BlogPostForm action={updateWithId} categories={categories} defaultValues={post} submitLabel="Enregistrer" />
      </div>
    </>
  );
}
