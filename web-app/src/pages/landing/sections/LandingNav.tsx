import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { cn } from "../../../lib/cn";

const NAV_LINKS: Array<{ href: string; label: string }> = [
  { href: "#tinh-nang", label: "Tính năng" },
  { href: "#cach-hoat-dong", label: "Cách hoạt động" },
  { href: "#vi-coin", label: "Ví coin" },
  { href: "#cau-hoi", label: "Câu hỏi thường gặp" },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-black/[0.06] bg-white/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav
        aria-label="Điều hướng chính"
        className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-6 px-5 lg:h-[72px] lg:px-8"
      >
        <Link
          to="/"
          aria-label="Ballmate - về trang chủ"
          className="flex items-center gap-2.5"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
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

        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/login"
            className="text-[13px] font-medium text-slate-500 transition-colors hover:text-primary"
          >
            Portal chủ sân
          </Link>
          <a
            href="#tai-app"
            className="inline-flex h-10 items-center justify-center rounded-[10px] bg-primary px-5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-all hover:bg-primary-dark hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_8px_24px_-12px_rgba(15,81,50,0.55)] active:translate-y-px"
          >
            Tải app
          </a>
        </div>

        <button
          type="button"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 lg:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="border-t border-black/[0.06] bg-white px-5 py-5 lg:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-primary"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4">
            <a
              href="#tai-app"
              onClick={() => setOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-[10px] bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Tải app
            </a>
            <Link
              to="/login"
              className="inline-flex h-11 items-center justify-center rounded-[10px] border border-slate-200 px-4 text-[13.5px] font-medium text-slate-700 hover:bg-slate-50"
            >
              Bạn là chủ sân? Vào Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
