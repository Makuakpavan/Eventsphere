import { eventCategories } from "@/lib/events";

export function CategoryStrip() {
  return (
    <section id="categories" className="container-wide py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[.2em] text-[#8b7da5]">Find your people</p>
          <h2 className="text-2xl font-black tracking-[-1px] sm:text-3xl">Explore by category</h2>
        </div>
        <span className="hidden text-sm font-semibold text-[#6d35e8] sm:block">Something for every mood ↗</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {eventCategories.map((category) => (
          <button key={category.name} className={`group flex items-center gap-3 rounded-2xl ${category.color} px-4 py-4 text-left transition hover:-translate-y-1 hover:shadow-md`}>
            <span className="text-2xl">{category.emoji}</span>
            <span className="text-sm font-extrabold text-[#292434]">{category.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
