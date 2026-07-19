import type { FaqItem } from "@/lib/content/types";

export function FaqList({ items }: { items: readonly FaqItem[] }) {
  return (
    <div className="faq-list">
      {items.map((item, index) => (
        <details key={item.question} open={index === 0}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
