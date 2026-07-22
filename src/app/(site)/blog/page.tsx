import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublishedPosts, getBlogCategories } from "@/lib/data/blog";

export const metadata: Metadata = {
  title: "Blog | Domify",
  description: "Actualités, conseils et analyses du marché immobilier marocain par Domify.",
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop";

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const [posts, categories] = await Promise.all([getPublishedPosts(category), getBlogCategories()]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-domify-dark">Blog Domify</h1>
      <p className="mt-1 text-sm text-domify-dark/60">Actualités, conseils et analyses du marché immobilier marocain</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/blog"
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-luxury ${!category ? "bg-domify-primary text-white" : "bg-domify-warm-white text-domify-dark/70"}`}
        >
          Tous
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/blog?category=${cat.slug}`}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-luxury ${category === cat.slug ? "bg-domify-primary text-white" : "bg-domify-warm-white text-domify-dark/70"}`}
          >
            {cat.name} ({cat._count.posts})
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-domify-warm-white p-10 text-center text-domify-dark/60">
          Aucun article publié pour le moment.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block overflow-hidden rounded-2xl bg-white shadow-luxury transition-luxury shadow-luxury-hover"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={post.coverImage || FALLBACK_IMAGE}
                  alt={post.title}
                  fill
                  className="object-cover transition-luxury group-hover:scale-105"
                />
                {post.category && (
                  <span className="absolute left-3 top-3 rounded-full bg-domify-gold px-3 py-1 text-xs font-semibold text-white">
                    {post.category.name}
                  </span>
                )}
              </div>
              <div className="p-5">
                <h2 className="font-display text-lg font-semibold text-domify-dark">{post.title}</h2>
                {post.excerpt && <p className="mt-2 line-clamp-2 text-sm text-domify-dark/60">{post.excerpt}</p>}
                <p className="mt-3 text-xs text-domify-dark/40">
                  {new Intl.DateTimeFormat("fr-MA", { dateStyle: "long" }).format(post.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
