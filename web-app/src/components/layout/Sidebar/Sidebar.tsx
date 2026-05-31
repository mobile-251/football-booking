import VenueSwitcher from "../../shared/VenueSwitcher/VenueSwitcher";
import { useCurrentVenue } from "../../../hooks/useCurrentVenue";
import { isManager } from "../../../types/auth";
import { cn } from "../../../lib/cn";
import {
  BCIcon,
  BTIcon,
  DKSIcon,
  DTIcon,
  LDSIcon,
  LogOutIcon,
  QLSIcon,
  TBIcon,
  TQIcon,
  UserIcon,
} from "../../../assets/icons";

interface MenuItemDef {
  id: string;
  icon: string;
  label: string;
  ownerOnly?: boolean;
}

interface MenuGroup {
  label: string;
  items: MenuItemDef[];
}

interface SidebarProps {
  activeMenuItem: string;
  onMenuItemClick: (menuItem: string) => void;
  collapsed: boolean;
  isOpen: boolean;
  isMobile: boolean;
  onToggle: () => void;
  onLogout: () => void;
  hideOwnerOnlyItems?: boolean;
}

function Sidebar({
  activeMenuItem,
  onMenuItemClick,
  collapsed,
  isOpen,
  isMobile,
  onLogout,
  hideOwnerOnlyItems = false,
}: SidebarProps) {
  const { currentVenue, user } = useCurrentVenue();

  const menuGroups: MenuGroup[] = [
    {
      label: "Vận hành",
      items: [
        { id: "Tổng quan", icon: TQIcon, label: "Tổng quan" },
        { id: "Lịch đặt sân", icon: LDSIcon, label: "Lịch đặt sân" },
        {
          id: "Quản lý nhân viên",
          icon: UserIcon,
          label: "Quản lý nhân viên",
          ownerOnly: true,
        },
        { id: "Quản lý sân", icon: QLSIcon, label: "Quản lý sân" },
        { id: "Gói combo", icon: BCIcon, label: "Gói combo" },
      ],
    },
    {
      label: "Cấu hình",
      items: [
        {
          id: "Đăng ký sân",
          icon: DKSIcon,
          label: "Đăng ký sân",
          ownerOnly: true,
        },
        { id: "Bảo trì", icon: BTIcon, label: "Bảo trì" },
      ],
    },
    {
      label: "Báo cáo",
      items: [
        { id: "Doanh thu", icon: DTIcon, label: "Doanh thu" },
        { id: "Thông báo", icon: TBIcon, label: "Thông báo" },
        { id: "Báo cáo", icon: BCIcon, label: "Báo cáo" },
      ],
    },
  ];

  const filterItems = (items: MenuItemDef[]) =>
    hideOwnerOnlyItems ? items.filter((item) => !item.ownerOnly) : items;

  const subtitleText =
    user && isManager(user)
      ? (currentVenue?.name ?? "Quản lý sân")
      : (currentVenue?.name ?? "Chọn sân để bắt đầu");

  const showLabels = !collapsed || isMobile;

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-[1000] flex h-screen flex-col overflow-hidden bg-gradient-to-br from-[#EAFBEA] to-[#F0FDF0] p-5 shadow-[2px_0_8px_rgba(0,0,0,0.1)] transition-[width,padding,transform] duration-300",
        collapsed && !isMobile ? "w-20 px-2.5" : "w-[280px]",
        isMobile && !isOpen && "-translate-x-full",
        isMobile && isOpen && "translate-x-0",
        "max-lg:w-[240px]",
      )}
    >
      <div className="mb-2 border-b border-black/10 pb-4">
        <div
          className={cn(
            "flex cursor-pointer items-start gap-3",
            collapsed && !isMobile && "flex-col items-center",
          )}
          onClick={() => onMenuItemClick("Tổng quan")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onMenuItemClick("Tổng quan")}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark">
            <img
              src={TQIcon}
              alt="Dashboard"
              className="h-5 w-5 icon-filter-white"
            />
          </div>
          {showLabels && (
            <div className="min-w-0 flex-1">
              <div className="text-base leading-6 text-primary">Ballmate</div>
              <div
                className="max-w-[180px] truncate text-xs font-medium leading-4 text-primary-muted"
                title={subtitleText}
              >
                {subtitleText}
              </div>
            </div>
          )}
        </div>
      </div>

      {showLabels && (
        <div className="mb-4 border-b border-black/10 pb-4 [.collapsed_&]:hidden">
          <VenueSwitcher />
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-0 overflow-y-auto">
        {menuGroups.map((group) => {
          const visibleItems = filterItems(group.items);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} className="mb-3">
              {visibleItems.map((item) => {
                const isActive = activeMenuItem === item.id;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "relative flex h-11 max-w-[246px] cursor-pointer items-center gap-3 rounded-lg px-4 text-primary transition-colors hover:bg-black/5",
                      collapsed &&
                        !isMobile &&
                        "mx-auto w-[60px] justify-center px-0",
                      isActive && "menu-item-active",
                    )}
                    onClick={() => onMenuItemClick(item.id)}
                    title={collapsed && !isMobile ? item.label : ""}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                      <img
                        src={item.icon}
                        alt={item.label}
                        className={cn(
                          "h-5 w-5",
                          isActive
                            ? "icon-filter-white"
                            : "icon-filter-primary",
                        )}
                      />
                    </span>
                    {showLabels && (
                      <span
                        className={cn(
                          "truncate text-sm leading-5",
                          isActive && "font-semibold text-white",
                        )}
                      >
                        {item.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        {/* <div
          className={cn(
            "flex h-11 max-w-[246px] cursor-pointer items-center gap-3 rounded-lg px-4 text-primary hover:bg-black/5",
            collapsed && !isMobile && "mx-auto w-[60px] justify-center px-0",
          )}
          title={collapsed && !isMobile ? "Chế độ tối" : ""}
          onClick={() => onMenuItemClick("Chế độ tối")}
        >
          <span className="flex h-6 w-6 items-center justify-center">
            <img
              src={DarkIcon}
              alt=""
              className="h-5 w-5 icon-filter-primary"
            />
          </span>
          {showLabels && <span className="text-sm">Chế độ tối</span>}
        </div> */}

        <div
          className={cn(
            "flex h-11 max-w-[246px] cursor-pointer items-center gap-3 rounded-lg px-4 text-danger hover:bg-black/5",
            collapsed && !isMobile && "mx-auto w-[60px] justify-center px-0",
          )}
          title={collapsed && !isMobile ? "Đăng xuất" : ""}
          onClick={onLogout}
        >
          <span className="flex h-6 w-6 items-center justify-center">
            <img
              src={LogOutIcon}
              alt=""
              className="h-5 w-5 icon-filter-danger"
            />
          </span>
          {showLabels && (
            <span className="text-sm font-medium text-danger">Đăng xuất</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
