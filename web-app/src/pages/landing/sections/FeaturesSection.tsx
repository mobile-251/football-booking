type Feature = {
  title: string;
  body: string;
  icon: React.ReactNode;
};

const FEATURES: Feature[] = [
  {
    title: "Tìm sân theo vị trí",
    body: "Bộ lọc theo khoảng cách, loại sân (5, 7, 11 người), giá thuê, dịch vụ kèm. Xem ngay sân trống trong bán kính 3km.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="22"
        height="22"
        aria-hidden="true"
      >
        <path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    title: "Lịch trống thời gian thực",
    body: "Mỗi slot bạn thấy là slot có thật. Không trùng giờ, không gọi điện xác nhận. Đặt xong là sân của bạn.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="22"
        height="22"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18" />
        <path d="M8 3v4M16 3v4" />
        <path d="M8 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Ví coin dùng cho mọi sân",
    body: "Nạp 1 lần qua chuyển khoản. Dùng coin đặt sân, mua combo và đặt dịch vụ. Nạp càng nhiều, bonus càng lớn.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="22"
        height="22"
        aria-hidden="true"
      >
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18" />
        <circle cx="17" cy="15" r="1.5" />
      </svg>
    ),
  },
  {
    title: "Combo thành viên tiết kiệm 25%",
    body: "Mua combo theo sân yêu thích. Đặt sân tuần nào cũng có chỗ, chi phí rẻ hơn đặt lẻ.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="22"
        height="22"
        aria-hidden="true"
      >
        <path d="M12 2l3 5 6 .9-4.5 4.2 1 6.1L12 15.6 6.5 18.2l1-6.1L3 7.9 9 7l3-5z" />
      </svg>
    ),
  },
  {
    title: "Đặt thêm trọng tài, bib, nước",
    body: "Đặt sân xong, chọn luôn dịch vụ kèm. Tới sân là có sẵn trọng tài, bộ áo bib và nước uống. Không cần lo trước.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="22"
        height="22"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9h.01M15 9h.01" />
        <path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" />
      </svg>
    ),
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="tinh-nang"
      aria-labelledby="features-title"
      className="bg-[#fafaf6] py-20 lg:py-28"
    >
      <div className="mx-auto w-full max-w-[1280px] px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-dark">
            Đặt sân chưa bao giờ dễ đến vậy
          </p>
          <h2
            id="features-title"
            className="mt-4 text-balance text-[clamp(1.9rem,3.6vw,3rem)] font-black leading-[1.1] tracking-tight text-slate-900"
          >
            Mọi thứ một cầu thủ cần,{" "}
            <span className="text-primary">trong một app.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[58ch] text-[16px] leading-relaxed text-slate-600">
            Từ tìm sân, đặt sân, thanh toán cho tới combo thành viên và dịch vụ
            kèm. Ballmate gom tất cả vào một app duy nhất.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-6 lg:gap-6">
          <article className="group relative col-span-1 overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-7 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all hover:-translate-y-1 hover:shadow-[0_24px_60px_-30px_rgba(15,81,50,0.35)] lg:col-span-4 lg:p-9">
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
              <div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {FEATURES[0].icon}
                </span>
                <h3 className="mt-5 text-[22px] font-bold tracking-tight text-slate-900">
                  {FEATURES[0].title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-slate-600">
                  {FEATURES[0].body}
                </p>
              </div>
              <div className="relative">
                <img
                  src="/landing/hero-pitch.jpg"
                  alt="Sân bóng cỏ nhân tạo trong app Ballmate, có sẵn để đặt ngay"
                  width={1024}
                  height={576}
                  loading="lazy"
                  decoding="async"
                  className="block h-auto w-full rounded-2xl border border-slate-100 object-cover"
                />
              </div>
            </div>
          </article>

          <article className="group relative col-span-1 overflow-hidden rounded-3xl border border-black/[0.06] bg-gradient-to-br from-primary to-primary-dark p-7 text-white shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all hover:-translate-y-1 hover:shadow-[0_24px_60px_-30px_rgba(15,81,50,0.55)] lg:col-span-2 lg:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white">
              {FEATURES[1].icon}
            </span>
            <h3 className="mt-5 text-[20px] font-bold tracking-tight">
              {FEATURES[1].title}
            </h3>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-white/85">
              {FEATURES[1].body}
            </p>
            <div
              aria-hidden="true"
              className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl"
            />
          </article>

          {FEATURES.slice(2).map((feature) => (
            <article
              key={feature.title}
              className="group col-span-1 rounded-3xl border border-black/[0.06] bg-white p-7 transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_18px_50px_-30px_rgba(15,81,50,0.35)] lg:col-span-2 lg:p-8"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                {feature.icon}
              </span>
              <h3 className="mt-5 text-[19px] font-bold tracking-tight text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-slate-600">
                {feature.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
