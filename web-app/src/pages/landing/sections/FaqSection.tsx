import { useState } from "react";
import { cn } from "../../../lib/cn";

type FaqItem = {
  q: string;
  a: string;
};

const FAQS: FaqItem[] = [
  {
    q: "Ballmate có miễn phí tải về không?",
    a: "Có. App Ballmate miễn phí 100% trên cả App Store và Google Play. Bạn chỉ trả tiền cho sân và dịch vụ bạn thật sự đặt.",
  },
  {
    q: "Coin trong app là gì? Có quy đổi ra tiền mặt không?",
    a: "1 coin tương đương 1.000 VND, dùng để đặt sân, mua combo và đặt dịch vụ trong app. Coin không quy đổi ngược ra tiền mặt nhưng số dư không bao giờ hết hạn.",
  },
  {
    q: "Nếu bận, có thể huỷ booking và nhận lại coin không?",
    a: "Có. Huỷ trước giờ chơi từ 24 giờ trở lên được hoàn 100% coin. Huỷ trong 24 giờ tính phí huỷ theo chính sách của từng sân, hiển thị rõ trước khi xác nhận.",
  },
  {
    q: "Combo thành viên hoạt động ra sao?",
    a: "Mỗi combo gắn với một sân và một loại sân (5, 7 hoặc 11 người). Mua combo 10 trận sẽ trừ 1 lượt cho mỗi lần đặt sân tương ứng, không phụ thuộc giờ peak hay off-peak.",
  },
  {
    q: "Tôi rủ bạn cài app có được thưởng coin không?",
    a: "Có chương trình giới thiệu: mỗi người bạn cài app và đặt sân lần đầu, bạn nhận thêm 50 coin. Mã giới thiệu cá nhân nằm trong phần Hồ sơ của app.",
  },
  {
    q: "Sân tôi hay đá chưa có trên Ballmate, làm sao thêm vào?",
    a: "Bạn có thể gửi đề xuất sân qua mục Hồ sơ trong app hoặc email đến hello@ballmate.vn. Đội Ballmate sẽ liên hệ chủ sân trong vòng 3 ngày làm việc.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="cau-hoi"
      aria-labelledby="faq-title"
      className="bg-[#fafaf6] py-20 lg:py-28"
    >
      <div className="mx-auto w-full max-w-[1024px] px-5 lg:px-8">
        <div className="text-center">
          <h2
            id="faq-title"
            className="text-balance text-[clamp(1.9rem,3.6vw,3rem)] font-black leading-[1.1] tracking-tight text-slate-900"
          >
            Câu hỏi thường gặp
          </h2>
          <p className="mx-auto mt-5 max-w-[58ch] text-[16px] leading-relaxed text-slate-600">
            Vẫn chưa tìm thấy câu trả lời? Nhắn{" "}
            <a
              href="https://zalo.me/ballmate"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              Zalo Ballmate
            </a>
            , đội hỗ trợ phản hồi trong vòng 4 giờ làm việc.
          </p>
        </div>

        <ul role="list" className="mt-12 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            const panelId = `faq-panel-${i}`;
            const buttonId = `faq-button-${i}`;
            return (
              <li key={faq.q}>
                <h3>
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left text-[16px] font-semibold text-slate-900 transition-colors hover:bg-slate-50 lg:px-8 lg:py-6 lg:text-[17px]"
                  >
                    <span>{faq.q}</span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-transform duration-300",
                        isOpen && "rotate-45 border-primary/30 text-primary",
                      )}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className="px-6 pb-6 text-[15px] leading-relaxed text-slate-600 lg:px-8 lg:pb-7"
                >
                  {faq.a}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
