import { useEffect, useRef, useState } from "react";

import { DropIcon } from "../../../assets/icons";
import { useCurrentVenue } from "../../../contexts/CurrentVenueContext";
import { isOwner } from "../../../types/auth";
import { cn } from "../../../lib/cn";

function VenueSwitcher() {
  const { venues, currentVenueId, currentVenue, setCurrentVenueId, user } =
    useCurrentVenue();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user || !isOwner(user) || venues.length === 0) {
    return null;
  }

  if (venues.length === 1) {
    return (
      <div className="flex flex-col gap-1 rounded-[10px] border border-primary/20 bg-white px-3 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-primary-muted">
          Sân
        </span>
        <span className="truncate text-[13px] font-semibold text-primary-dark">
          {venues[0].name}
        </span>
      </div>
    );
  }

  return (
    <div className="relative my-3 w-full" ref={rootRef}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-primary-muted">
        Sân đang quản lý
      </span>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-[10px] border border-primary/25 bg-white px-3 py-2.5 text-left transition-[border-color,box-shadow] hover:border-primary hover:shadow-[0_2px_8px_rgba(31,102,80,0.1)]"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="mr-2 flex-1 truncate text-[13px] font-semibold text-primary-dark">
          {currentVenue?.name ?? "Chọn sân"}
        </span>
        <img
          src={DropIcon}
          alt=""
          className={cn(
            "h-4 w-4 shrink-0 icon-filter-primary transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <ul
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-60 list-none overflow-y-auto rounded-[10px] border border-gray-200 bg-white p-1.5 shadow-[var(--shadow-card-lg)]"
          role="listbox"
        >
          {venues.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                role="option"
                aria-selected={v.id === currentVenueId}
                className={cn(
                  "flex w-full flex-col items-start rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-primary-light",
                  v.id === currentVenueId && "bg-primary-light",
                )}
                onClick={() => {
                  setCurrentVenueId(v.id);
                  setOpen(false);
                }}
              >
                <span className="text-[13px] font-semibold text-primary-dark">
                  {v.name}
                </span>
                {v.address && (
                  <span className="mt-0.5 max-w-full truncate text-[11px] text-primary-muted">
                    {v.address}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default VenueSwitcher;
