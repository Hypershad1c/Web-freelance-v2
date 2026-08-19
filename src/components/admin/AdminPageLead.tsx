import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

export function AdminPageLead({
  eyebrow,
  title,
  description,
  icon: Icon = Sparkles,
  metric,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  metric?: { value: number | string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <section className="admin-page-lead">
      <div className="flex min-w-0 gap-4">
        <span className="admin-page-lead__icon"><Icon size={20} /></span>
        <div className="min-w-0"><p className="admin-eyebrow">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {metric && <span className="admin-page-lead__metric"><strong>{metric.value}</strong><small>{metric.label}</small></span>}
        {children}
      </div>
    </section>
  );
}

export function AdminEmptyState({ icon: Icon = Sparkles, title, description }: { icon?: LucideIcon; title: string; description: string }) {
  return (
    <div className="admin-empty-state"><span><Icon size={25} /></span><h3>{title}</h3><p>{description}</p></div>
  );
}
