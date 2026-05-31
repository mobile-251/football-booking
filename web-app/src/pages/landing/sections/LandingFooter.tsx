import { Link } from "react-router-dom";

type FooterGroup = {
  title: string;
  links: Array<{ label: string; href: string; external?: boolean }>;
};

const GROUPS: FooterGroup[] = [
  {
    title: "App Ballmate",
    links: [
      { label: "Tải trên App Store", href: "https://apps.apple.com", external: true },
      { label: "Tải trên Google Play", href: "https://play.google.com", external: true },
      { label: "Tính năng", href: "#tinh-nang" },
      { label: "Cách hoạt động", href: "#cach-hoat-dong" },
    ],
  },
  {
    title: "Hỗ trợ cầu thủ",
    links: [
      { label: "Hướng dẫn nạp coin", href: "/huong-dan/nap-coin" },
      { label: "Chính sách huỷ và hoàn coin", href: "/chinh-sach/hoan-coin" },
      { label: "Câu hỏi thường gặp", href: "#cau-hoi" },
      { label: "Chat Zalo Ballmate", href: "https://zalo.me/ballmate", external: true },
    ],
  },
  {
    title: "Công ty",
    links: [
      { label: "Giới thiệu Ballmate", href: "/ve-chung-toi" },
      { label: "Blog cộng đồng bóng đá", href: "/blog" },
      { label: "Tuyển dụng", href: "/tuyen-dung" },
      { label: "Liên hệ báo chí", href: "mailto:press@ballmate.vn" },
    ],
  },
  {
    title: "Dành cho chủ sân",
    links: [
      { label: "Đăng sân lên Ballmate", href: "/register" },
      { label: "Đăng nhập Portal", href: "/login" },
      { label: "Mức phí cho chủ sân", href: "/cho-chu-san" },
    ],
  },
  {
    title: "Pháp lý",
    links: [
      { label: "Điều khoản sử dụng", href: "/dieu-khoan" },
      { label: "Chính sách bảo mật", href: "/bao-mat" },
      { label: "Chính sách cookie", href: "/cookie" },
      { label: "Nghị định 13/2023", href: "/ndcp-13" },
    ],
  },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-slate-100 bg-[#fafaf6] pt-16 pb-10 lg:pt-20">
      <div className="mx-auto w-full max-w-[1280px] px-5 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_1fr] lg:gap-10">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link to="/" aria-label="Ballmate - về trang chủ" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 3l3 4-3 3-3-3 3-4z" />
                  <path d="M3.6 9.5l4.4 1.5-1 4.5-4.4-1" />
                  <path d="M20.4 9.5l-4.4 1.5 1 4.5 4.4-1" />
                  <path d="M9 17l3 4 3-4" />
                </svg>
              </span>
              <span className="text-[17px] font-extrabold tracking-tight text-slate-900">
                Ballmate
              </span>
            </Link>
            <p className="mt-5 max-w-[34ch] text-[14px] leading-relaxed text-slate-600">
              App đặt sân bóng đá phong trào số 1 Việt Nam. Hơn 240 sân cỏ nhân
              tạo, đặt nhanh, thanh toán bằng ví coin.
            </p>
            <address className="mt-6 not-italic text-[13.5px] leading-relaxed text-slate-500">
              Công ty TNHH Ballmate Việt Nam
              <br />
              Tầng 4, 27 Nguyễn Trung Trực, Bến Thành, Quận 1, TP. HCM
              <br />
              <a
                href="mailto:hello@ballmate.vn"
                className="font-semibold text-primary hover:underline"
              >
                hello@ballmate.vn
              </a>{" "}
              · (+84) 28 7300 0000
            </address>
          </div>

          {GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] text-slate-900">
                {group.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[14px] text-slate-600 transition-colors hover:text-primary"
                      >
                        {link.label}
                      </a>
                    ) : link.href.startsWith("#") || link.href.startsWith("mailto:") ? (
                      <a
                        href={link.href}
                        className="text-[14px] text-slate-600 transition-colors hover:text-primary"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-[14px] text-slate-600 transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-slate-200 pt-7 text-[13px] text-slate-500 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Ballmate Việt Nam. Mọi quyền được bảo lưu.</p>
          <ul className="flex items-center gap-5" role="list">
            <li>
              <a
                href="https://www.facebook.com/ballmate.vn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Theo dõi Ballmate trên Facebook"
                className="text-slate-500 transition-colors hover:text-primary"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" />
                </svg>
              </a>
            </li>
            <li>
              <a
                href="https://www.youtube.com/@ballmate"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Đăng ký kênh Ballmate trên YouTube"
                className="text-slate-500 transition-colors hover:text-primary"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8A3 3 0 0 0 2.6 20c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
                </svg>
              </a>
            </li>
            <li>
              <a
                href="https://zalo.me/ballmate"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat với Ballmate trên Zalo"
                className="text-slate-500 transition-colors hover:text-primary"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.5 2 2 5.9 2 10.7c0 2.7 1.5 5.2 4 6.8l-.7 2.6c-.1.4.3.7.6.5l3-1.6c1 .2 2 .3 3.1.3 5.5 0 10-3.9 10-8.6S17.5 2 12 2z" />
                </svg>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
