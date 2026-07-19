import type { FaqItem } from "@/lib/content/types";

type FaqListProps = {
  items: readonly FaqItem[];
  openAll?: boolean;
};

export function FaqList({ items, openAll = false }: FaqListProps) {
  return (
    <div className="faq-list">
      {items.map((item, index) => (
        <details key={item.question} open={openAll || index === 0}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
