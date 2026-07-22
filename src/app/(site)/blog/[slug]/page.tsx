import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar } from "lucide-react";
import { getPostBySlug, getRecentPosts } from "@/lib/data/blog";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.seoTitle || `${post.title} | Domify Blog`,
    description: post.seoDescription || post.excerpt || post.content.slice(0, 155),
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const related = await getRecentPosts(3, post.id);
  const paragraphs = post.content.split(/\n\s*\n/).filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 flex items-center gap-2 text-xs text-domify-dark/50">
        <Link href="/" className="hover:text-domify-primary">Accueil</Link> /
        <Link href="/blog" className="hover:text-domify-primary">Blog</Link> /
        <span className="text-domify-dark/80">{post.title}</span>
      </nav>

      {post.category && (
        <span className="inline-block rounded-full bg-domify-gold/10 px-3 py-1 text-xs font-semibold text-domify-gold">
          {post.category.name}
        </span>
      )}
      <h1 className="mt-3 font-display text-3xl font-bold text-domify-dark sm:text-4xl">{post.title}</h1>
      <p className="mt-3 flex items-center gap-1.5 text-sm text-domify-dark/50">
        <Calendar size={14} /> {new Intl.DateTimeFormat("fr-MA", { dateStyle: "long" }).format(post.createdAt)}
      </p>

      <div className="relative mt-8 h-72 w-full overflow-hidden rounded-2xl sm:h-96">
        <Image src={post.coverImage || FALLBACK_IMAGE} alt={post.title} fill className="object-cover" priority />
      </div>

      <div className="mt-8">
        {paragraphs.map((p, i) => (
          <p key={i} className="mb-5 leading-relaxed text-domify-dark/80">{p}</p>
        ))}
      </div>

      {related.length > 0 && (
        <div className="mt-16 border-t border-black/5 pt-10">
          <h2 className="mb-6 font-display text-xl font-semibold text-domify-dark">À lire aussi</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} href={`/blog/${r.slug}`} className="rounded-xl bg-domify-warm-white p-4 transition-luxury hover:bg-domify-warm-white/70">
                <p className="font-medium text-domify-dark">{r.title}</p>
                {r.excerpt && <p className="mt-1 line-clamp-2 text-xs text-domify-dark/60">{r.excerpt}</p>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
