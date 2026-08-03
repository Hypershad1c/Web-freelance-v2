// Server Component — just renders a <script type="application/ld+json">. Kept as
// its own tiny component so every page injects structured data the same way.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
