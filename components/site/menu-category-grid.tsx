import { MENU_CATEGORIES, MENU_ITEMS } from "@/lib/content/store";

export function MenuCategoryGrid({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`menu-category-grid${compact ? " menu-category-grid--compact" : ""}`}>
      {MENU_CATEGORIES.map((category) => {
        const items = MENU_ITEMS.filter((item) => item.category === category.id);
        const visibleItems = compact ? items.slice(0, 4) : items;

        return (
          <section className="menu-category" id={`menu-${category.id}`} key={category.id}>
            <p className="eyebrow">{category.label}</p>
            <h3>{category.description}</h3>
            <ul>
              {visibleItems.map((item) => (
                <li key={item.slug}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.description}</p>
                    {item.minimumOrder ? <small>{item.minimumOrder}인 이상 주문</small> : null}
                  </div>
                  <span>{item.price}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
