import AppStoreBadges from "./AppStoreBadges";

export default function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-[radial-gradient(80%_60%_at_50%_0%,#eafbea_0%,#fdfdfa_55%,#fdfdfa_100%)] pt-28 pb-16 lg:pt-32 lg:pb-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent"
      />

      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-12 px-5 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-8">
        <div className="animate-[fade-in_0.7s_ease-out] text-balance">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-primary-dark">
            <span
              className="h-1.5 w-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />
            App đặt sân bóng số 1 Việt Nam
          </p>

          <h1
            id="hero-title"
            className="text-[clamp(2.25rem,4.2vw,3.5rem)] font-black leading-[1.05] tracking-tight text-slate-900"
          >
            Sân bóng gần bạn.
            <span className="block text-primary">Đặt trong 30 giây.</span>
          </h1>

          <p className="mt-6 max-w-[56ch] text-[17px] leading-relaxed text-slate-600 lg:text-lg">
            Lịch trống thời gian thực, thanh toán bằng ví coin. Ngừng gọi điện.
            Mở app, chọn sân, đá bóng.
          </p>

          <div className="mt-9 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
            <div className="hidden flex-shrink-0 lg:block">
              <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_30px_-15px_rgba(15,81,50,0.25)]">
                <img
                  src="/landing/qr-app.svg"
                  alt="Mã QR tải app Ballmate cho iOS và Android"
                  width={112}
                  height={112}
                  loading="eager"
                  decoding="async"
                  className="h-28 w-28 rounded-lg"
                />
                <div className="max-w-[160px]">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Quét QR
                  </p>
                  <p className="mt-1 text-[14px] font-bold leading-tight text-slate-900">
                    Tải Ballmate cho iOS &amp; Android
                  </p>
                  <p className="mt-1 text-[12px] text-slate-500">
                    Miễn phí, dung lượng dưới 30MB
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:hidden">
              <AppStoreBadges variant="dark" />
            </div>
          </div>

          <p className="mt-6 flex items-center gap-2 text-[13.5px] text-slate-500">
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="text-primary"
            >
              <path d="M5 12l5 5 9-11" />
            </svg>
            200.000+ cầu thủ đã đặt sân trên Ballmate
          </p>
        </div>

        <div className="relative animate-[slide-up_0.9s_ease-out_0.1s_both]">
          <div
            aria-hidden="true"
            className="absolute -top-10 -right-6 h-44 w-44 rounded-full bg-primary/20 blur-3xl lg:-top-16 lg:-right-12 lg:h-60 lg:w-60"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-10 -left-6 h-40 w-40 rounded-full bg-primary-light/80 blur-3xl"
          />
          <img
            src="/landing/hero-phone.jpg"
            alt="Giao diện ứng dụng Ballmate trên điện thoại hiển thị danh sách sân bóng gần bạn, khoảng cách, giá thuê và nút đặt sân nhanh"
            width={1024}
            height={768}
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="relative mx-auto block h-auto w-full max-w-[480px] drop-shadow-[0_30px_60px_rgba(15,81,50,0.25)] lg:max-w-[560px]"
          />
        </div>
      </div>
    </section>
  );
}
