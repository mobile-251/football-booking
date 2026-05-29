import { useCurrentVenue } from "../../../contexts/CurrentVenueContext";
import { cn } from "../../../lib/cn";
import { getRoleLabel, getStoredUser, isManager } from "../../../types/auth";
import { TBIcon } from "../../../assets/icons";

interface HeaderProps {
  onToggleSidebar: () => void;
  isMobile: boolean;
  sidebarCollapsed?: boolean;
  pageTitle: string;
}

function Header({
  onToggleSidebar,
  isMobile,
  sidebarCollapsed = false,
}: HeaderProps) {
  const storedUser = getStoredUser();
  const fullName = storedUser?.fullName || "Người dùng";
  const roleLabel = storedUser ? getRoleLabel(storedUser.role) : "Người dùng";
  const { currentVenue } = useCurrentVenue();

  const showVenueInHeader =
    storedUser && isManager(storedUser) && currentVenue && !isMobile;

  return (
    <header
      className={cn(
        "fixed right-0 top-0 z-[100] bg-gradient-to-br from-[#EAFBEA] to-[#F0FDF0] transition-[left] duration-300",
        isMobile ? "left-0" : sidebarCollapsed ? "left-20" : "left-[280px]",
      )}
    >
      <div className="flex min-h-16 items-center justify-between gap-4 px-6 py-4 max-md:px-4 max-md:py-3">
        {isMobile && (
          <button
            type="button"
            className="mr-auto flex h-8 w-8 flex-col justify-around rounded p-1.5 hover:bg-primary/10"
            onClick={onToggleSidebar}
            aria-label="Mở menu"
          >
            <span className="h-0.5 w-full rounded-sm bg-primary" />
            <span className="h-0.5 w-full rounded-sm bg-primary" />
            <span className="h-0.5 w-full rounded-sm bg-primary" />
          </button>
        )}

        <div className="min-w-0 flex-1">
          {showVenueInHeader && (
            <p className="mt-0.5 max-w-[280px] truncate text-xs font-medium text-primary-muted">
              {currentVenue.name}
            </p>
          )}
        </div>

        <div className="flex items-center gap-5">
          <div
            className="relative flex h-6 w-6 items-center justify-center"
            title="Thông báo"
          >
            <img src={TBIcon} alt="Notification" className="h-5 w-5" />
            <span
              className="absolute right-0 top-0 h-2 w-2 rounded-full border-2 border-[#eafbea] bg-danger"
              aria-hidden
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-base font-bold text-white">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden flex-col items-start md:flex">
              <div className="text-sm leading-5 text-primary">{fullName}</div>
              <div className="text-xs leading-4 text-primary-muted">
                {roleLabel}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
