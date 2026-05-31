export default function TestimonialSection() {
  return (
    <section
      aria-labelledby="testimonial-title"
      className="bg-white py-20 lg:py-28"
    >
      <div className="mx-auto w-full max-w-[1280px] px-5 lg:px-8">
        <figure className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-3 rounded-3xl bg-primary/10 blur-2xl"
            />
            <img
              src="/landing/player-portrait.jpg"
              alt="Anh Nguyễn Minh Quân, cầu thủ phong trào tại TP. HCM, cầm bóng và mặc áo đấu trên sân cỏ nhân tạo"
              width={800}
              height={800}
              loading="lazy"
              decoding="async"
              className="relative aspect-square w-full rounded-3xl border border-black/[0.06] object-cover shadow-[0_24px_60px_-30px_rgba(15,81,50,0.4)]"
            />
          </div>

          <div>
            <h2
              id="testimonial-title"
              className="text-balance text-[clamp(1.75rem,3.2vw,2.6rem)] font-bold leading-[1.15] tracking-tight text-slate-900"
            >
              "Nhóm tôi đá bóng tuần 3 buổi. Từ ngày dùng Ballmate, không còn
              cảnh 5 người trong group chat thay nhau gọi điện đặt sân lúc 10
              giờ tối."
            </h2>

            <figcaption className="mt-7 flex flex-col gap-1">
              <span className="text-[15px] font-bold text-slate-900">
                Nguyễn Minh Quân
              </span>
              <span className="text-[14px] text-slate-500">
                Cầu thủ phong trào, đội FC Sài Gòn Sunday
              </span>
            </figcaption>

            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-slate-100 pt-7 text-[13.5px] text-slate-600">
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="font-mono text-[20px] font-black text-primary"
                >
                  142
                </span>{" "}
                trận đã đặt qua app
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="font-mono text-[20px] font-black text-primary"
                >
                  2
                </span>{" "}
                combo đang hoạt động
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="font-mono text-[20px] font-black text-primary"
                >
                  76
                </span>{" "}
                ngày streak điểm danh
              </span>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}
