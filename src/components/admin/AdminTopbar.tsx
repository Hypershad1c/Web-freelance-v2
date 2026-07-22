import { auth } from "@/lib/auth";
import { signOutAction } from "@/lib/actions/auth";
import { LogOut } from "lucide-react";

export async function AdminTopbar({ title }: { title: string }) {
  const session = await auth();

  return (
    <header className="flex h-20 items-center justify-between border-b border-black/5 bg-white px-6 lg:px-10">
      <h1 className="font-display text-2xl font-semibold text-domify-dark">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-domify-dark">{session?.user?.name ?? session?.user?.email}</p>
          <p className="text-xs text-domify-dark/50">{session?.user?.role}</p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-domify-warm-white text-domify-dark/60 hover:text-domify-primary"
            aria-label="Se déconnecter"
          >
            <LogOut size={15} />
          </button>
        </form>
      </div>
    </header>
  );
}
