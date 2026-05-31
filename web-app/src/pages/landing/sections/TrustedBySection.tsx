type Partner = {
  name: string;
  initials: string;
};

const PARTNERS: Partner[] = [
  { name: "Star Football Arena Hà Nội", initials: "SF" },
  { name: "Green Pitch Đà Nẵng", initials: "GP" },
  { name: "Đông Đô Sports Club", initials: "ĐĐ" },
  { name: "Saigon Mini Soccer", initials: "SMS" },
  { name: "Phú Mỹ Hưng Sport Hub", initials: "PMH" },
  { name: "Bình Tân Football Center", initials: "BTF" },
];

export default function TrustedBySection() {
  return (
    <section
      aria-labelledby="trust-title"
      className="border-y border-slate-100 bg-white py-12 lg:py-16"
    >
      <div className="mx-auto w-full max-w-[1280px] px-5 lg:px-8">
        <h2
          id="trust-title"
          className="text-center text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-500"
        >
          Đặt sân tại 240+ điểm cỏ nhân tạo trên toàn quốc
        </h2>

        <ul
          role="list"
          className="mt-8 grid grid-cols-2 items-center gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6"
        >
          {PARTNERS.map((p) => (
            <li key={p.name} className="flex items-center justify-center">
              <div
                className="group flex h-10 items-center gap-2.5 opacity-70 transition-all duration-200 hover:opacity-100"
                aria-label={p.name}
                title={p.name}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[11px] font-bold tracking-wide text-slate-700 group-hover:border-primary/40 group-hover:text-primary">
                  {p.initials}
                </span>
                <span className="hidden text-[13px] font-semibold text-slate-700 group-hover:text-primary md:inline">
                  {p.name}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
