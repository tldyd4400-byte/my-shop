export function ProofStrip({ items }: { items: readonly string[] }) {
  return (
    <section className="proof-strip" aria-label="매장 핵심 정보">
      <div className="shell proof-strip-inner">
        {items.map((item) => (
          <strong key={item}>{item}</strong>
        ))}
      </div>
    </section>
  );
}
