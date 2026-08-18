import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-domify-primary-dark px-6 text-center text-white">
      <div className="max-w-lg">
        <p className="luxury-eyebrow text-domify-soft-gold">Domify</p>
        <h1 className="mt-5 font-display text-6xl font-semibold">404</h1>
        <p className="mt-5 text-lg text-white/70">La page demandée n’existe pas ou n’est plus disponible.</p>
        <Link href="/" className="pressable mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-domify-soft-gold px-6 py-3 text-sm font-bold text-domify-primary-dark">
          Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}
