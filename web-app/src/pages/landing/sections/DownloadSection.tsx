import AppStoreBadges from "./AppStoreBadges";

export default function DownloadSection() {
  return (
    <section
      id="tai-app"
      aria-labelledby="download-title"
      className="bg-white pt-20 pb-24 lg:pt-28 lg:pb-32"
    >
      <div className="mx-auto w-full max-w-[1200px] px-5 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-[32px] bg-gradient-to-br from-primary to-primary-dark p-7 text-white shadow-[0_30px_80px_-30px_rgba(15,81,50,0.55)] lg:p-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_20%_15%,rgba(255,255,255,0.18),transparent_55%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          />

          <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                Tải app miễn phí
              </p>
              <h2
                id="download-title"
                className="mt-4 text-balance text-[clamp(2rem,4vw,3.4rem)] font-black leading-[1.05] tracking-tight"
              >
                Trận bóng tiếp theo của bạn{" "}
                <span className="text-primary-light">cách đúng một lần quét.</span>
              </h2>
              <p className="mt-5 max-w-[52ch] text-[16.5px] leading-relaxed text-white/85">
                Quét QR bằng camera điện thoại, hoặc tải Ballmate từ App Store và
                Google Play. Cài app trong dưới 1 phút, đặt sân ngay tối nay.
              </p>

              <div className="mt-8">
                <AppStoreBadges variant="dark" />
              </div>

              <ul role="list" className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  "Miễn phí, không quảng cáo",
                  "Hỗ trợ iOS 14+ và Android 9+",
                  "Có sẵn tại Hà Nội, Đà Nẵng, TP. HCM",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2 text-[13.5px] text-white/85">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 flex-shrink-0 text-white">
                      <path d="M5 12l5 5 9-11" />
                    </svg>
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="rounded-3xl bg-white p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)] lg:p-6">
                <img
                  src="/landing/qr-app.svg"
                  alt="Mã QR tải app Ballmate cho iOS và Android"
                  width={240}
                  height={240}
                  loading="lazy"
                  decoding="async"
                  className="h-48 w-48 rounded-xl lg:h-60 lg:w-60"
                />
                <p className="mt-4 text-center text-[13px] font-semibold text-slate-900">
                  Quét bằng camera điện thoại
                </p>
                <p className="mt-1 text-center text-[12px] text-slate-500">
                  Tự động mở đúng App Store / Google Play
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
