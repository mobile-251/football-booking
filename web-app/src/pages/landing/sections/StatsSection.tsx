type Stat = {
  value: string;
  label: string;
  detail: string;
};

const STATS: Stat[] = [
  {
    value: "200K+",
    label: "Cầu thủ đang dùng app",
    detail: "Cộng đồng yêu bóng đá lớn nhất Việt Nam",
  },
  {
    value: "10+",
    label: "Sân cỏ nhân tạo đối tác",
    detail: "Trên các tỉnh thành",
  },
  {
    value: "30 giây",
    label: "Thời gian đặt sân trung bình",
    detail: "Nhanh hơn việc gọi điện hỏi giá rất nhiều",
  },
];

export default function StatsSection() {
  return (
    <section
      aria-labelledby="stats-title"
      className="relative isolate overflow-hidden bg-gradient-to-br from-primary to-primary-dark py-20 text-white lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_85%_15%,rgba(255,255,255,0.12),transparent_60%)]"
      />
      <div className="relative mx-auto w-full max-w-[1280px] px-5 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <h2
              id="stats-title"
              className="text-balance text-[clamp(1.9rem,3.4vw,2.8rem)] font-black leading-[1.1] tracking-tight"
            >
              Cộng đồng cầu thủ Việt{" "}
              <span className="text-primary-light">đang chọn Ballmate.</span>
            </h2>
            <p className="mt-5 max-w-[42ch] text-[15.5px] leading-relaxed text-white/85">
              Mỗi ngày có hàng nghìn trận bóng được đặt qua app. Cùng đông đảo
              cộng đồng cầu thủ phong trào trên cả nước.
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:gap-8">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/15 bg-white/[0.06] p-6 backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-white/[0.1]"
              >
                <dt className="text-[12px] font-semibold uppercase tracking-wide text-white/70">
                  {stat.label}
                </dt>
                <dd className="mt-4 font-mono text-[clamp(2.2rem,3vw,3rem)] font-black leading-none tracking-tight text-white">
                  {stat.value}
                </dd>
                <p className="mt-3 text-[13.5px] leading-relaxed text-white/75">
                  {stat.detail}
                </p>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
