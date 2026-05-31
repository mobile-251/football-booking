type Perk = {
  title: string;
  body: string;
};

const PERKS: Perk[] = [
  {
    title: "Điểm danh 7 ngày = 7 coin",
    body: "Streak càng dài, phần thưởng càng lớn. Streak 30 ngày nhận tới 30 coin.",
  },
  {
    title: "Top-up tự động khi thiếu",
    body: "Đặt sân mà thiếu coin? Hệ thống giữ slot 10 phút để bạn nạp ngay trong app.",
  },
  {
    title: "Coin dùng cho mọi thứ",
    body: "Đặt sân, mua combo, đặt trọng tài, bib, nước. Một loại tiền cho mọi giao dịch.",
  },
];

export default function CoinSection() {
  return (
    <section
      id="vi-coin"
      aria-labelledby="coin-title"
      className="bg-[#fafaf6] py-20 lg:py-28"
    >
      <div className="mx-auto w-full max-w-[1280px] px-5 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div className="relative order-2 lg:order-1">
            <div
              aria-hidden="true"
              className="absolute -top-8 -left-6 h-40 w-40 rounded-full bg-primary/20 blur-3xl lg:-top-12 lg:-left-10 lg:h-56 lg:w-56"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-6 -right-8 h-32 w-32 rounded-full bg-primary-light/80 blur-3xl"
            />
            <img
              src="/landing/coin-phone.jpg"
              alt="Màn hình điểm danh hàng ngày của app Ballmate hiển thị số dư coin và phần thưởng theo streak"
              width={1024}
              height={768}
              loading="lazy"
              decoding="async"
              className="relative mx-auto block h-auto w-full max-w-[520px] rounded-[28px] border border-black/[0.06] object-cover shadow-[0_24px_60px_-30px_rgba(15,81,50,0.4)]"
            />
          </div>

          <div className="order-1 lg:order-2">
            <h2
              id="coin-title"
              className="text-balance text-[clamp(1.9rem,3.6vw,3rem)] font-black leading-[1.1] tracking-tight text-slate-900"
            >
              Điểm danh mỗi ngày.{" "}
              <span className="text-primary">Nhận coin miễn phí.</span>
            </h2>
            <p className="mt-5 max-w-[58ch] text-[16px] leading-relaxed text-slate-600">
              Mở app mỗi ngày để nhận coin và tích streak. Coin tích được dùng
              trực tiếp để đặt sân, mua combo hoặc đặt dịch vụ kèm. Càng đều
              đặn, càng tiết kiệm.
            </p>

            <ul
              role="list"
              className="mt-8 flex flex-col gap-5 border-t border-slate-200 pt-7"
            >
              {PERKS.map((perk) => (
                <li key={perk.title} className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12l5 5 9-11" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="text-[16px] font-bold text-slate-900">
                      {perk.title}
                    </h3>
                    <p className="mt-1 text-[14.5px] leading-relaxed text-slate-600">
                      {perk.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
