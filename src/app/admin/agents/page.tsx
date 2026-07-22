import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteAgent } from "@/lib/actions/network";

export default async function AdminAgentsPage() {
  const agents = await prisma.agent.findMany({
    include: { agency: true, _count: { select: { properties: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <AdminTopbar title="Agents" />
      <div className="p-6 lg:p-10">
        <div className="mb-6 flex justify-end">
          <Link href="/admin/agents/new" className="flex items-center gap-2 rounded-xl bg-domify-gold px-4 py-2.5 text-sm font-semibold text-white shadow-luxury">
            <Plus size={16} /> Nouvel agent
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-luxury">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-domify-warm-white/50 text-xs uppercase tracking-wide text-domify-dark/50">
              <tr>
                <th className="px-5 py-3 font-medium">Agent</th>
                <th className="px-5 py-3 font-medium">Agence</th>
                <th className="px-5 py-3 font-medium">Propriétés</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {agents.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-domify-dark/50">Aucun agent.</td></tr>
              ) : agents.map((a) => (
                <tr key={a.id} className="hover:bg-domify-warm-white/30">
                  <td className="px-5 py-3 font-medium text-domify-dark">{a.name}</td>
                  <td className="px-5 py-3 text-domify-dark/70">{a.agency?.name ?? "Indépendant"}</td>
                  <td className="px-5 py-3 text-domify-dark/70">{a._count.properties}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/agents/${a.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-domify-dark/40 hover:bg-domify-warm-white hover:text-domify-primary" aria-label="Modifier">
                        <Pencil size={15} />
                      </Link>
                      <DeleteButton action={deleteAgent.bind(null, a.id)} confirmLabel={`Supprimer ${a.name} ?`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
