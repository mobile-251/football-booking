type Step = {
  title: string;
  body: string;
  icon: React.ReactNode;
};

const STEPS: Step[] = [
  {
    title: "Cài app và tìm sân gần bạn",
    body: "Tải Ballmate miễn phí trên iOS hoặc Android. App tự định vị, gợi ý ngay những sân cỏ nhân tạo còn trống xung quanh bạn.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden="true">
        <rect x="7" y="3" width="10" height="18" rx="2" />
        <path d="M11 18h2" />
      </svg>
    ),
  },
  {
    title: "Chọn khung giờ và thanh toán bằng coin",
    body: "Xem lịch trống thời gian thực, chọn slot phù hợp. Thiếu coin? Nạp ngay trong app qua MoMo, VNPay hoặc chuyển khoản. Booking xong trong 30 giây.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18" />
        <path d="M8 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Tới sân, chơi hết mình",
    body: "Nhận xác nhận tức thì. Tới sân là có sẵn trọng tài, bib và nước nếu bạn đã đặt kèm. Xong trận, đánh giá sân để cộng đồng cùng biết.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3l3 4-3 3-3-3 3-4z" />
        <path d="M3.6 9.5l4.4 1.5-1 4.5-4.4-1" />
        <path d="M20.4 9.5l-4.4 1.5 1 4.5 4.4-1" />
        <path d="M9 17l3 4 3-4" />
      </svg>
    ),
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="cach-hoat-dong"
      aria-labelledby="how-title"
      className="bg-white py-20 lg:py-28"
    >
      <div className="mx-auto w-full max-w-[1280px] px-5 lg:px-8">
        <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-[1fr_1fr]">
          <h2
            id="how-title"
            className="text-balance text-[clamp(1.9rem,3.6vw,3rem)] font-black leading-[1.1] tracking-tight text-slate-900"
          >
            Từ mở app đến đặt sân{" "}
            <span className="text-primary">chưa tới một phút.</span>
          </h2>
          <p className="max-w-[52ch] text-[16px] leading-relaxed text-slate-600 lg:justify-self-end lg:text-right">
            Không phải gọi điện. Không phải đợi xác nhận. Không phải lo trùng giờ.
            Mọi sân trên Ballmate đều đặt được trực tiếp trong app.
          </p>
        </div>

        <ol className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="group relative flex flex-col rounded-3xl border border-slate-100 bg-[#fafaf6] p-7 transition-all hover:-translate-y-1 hover:border-primary/20 hover:bg-white hover:shadow-[0_18px_50px_-30px_rgba(15,81,50,0.35)] lg:p-8"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[44px] font-black leading-none tracking-tight text-slate-200 transition-colors group-hover:text-primary/30">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {step.icon}
                </span>
              </div>
              <h3 className="mt-6 text-[19px] font-bold tracking-tight text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-slate-600">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
