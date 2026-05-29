import { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import Header from "../../components/layout/Header/Header";
import DevelopmentModal from "../../components/shared/DevelopmentModal/DevelopmentModal";
import FieldRegister from "../field-register/FieldRegister";
import BookingSchedule from "../booking/BookingSchedule";
import OverviewDashboard from "../overview/OverviewDashboard";
import VenueManagerList from "../venue-managers/VenueManagerList";
import VenueManagementPage from "../venue-management/VenueManagementPage";
import { useCurrentVenue } from "../../hooks/useCurrentVenue";
import { getStoredUser, isOwner } from "../../types/auth";
import EmptyState from "../../components/ui/EmptyState";
import { cn } from "../../lib/cn";
import { PATHS } from "../../routes/paths";

const IMPLEMENTED_MENUS = [
  "Tổng quan",
  "Quản lý sân",
  "Đăng ký sân",
  "Lịch đặt sân",
  "Quản lý nhân viên",
];

export default function DashboardLayout() {
  const [activeMenuItem, setActiveMenuItem] = useState(() => {
    return localStorage.getItem("activeMenuItem") || "Tổng quan";
  });
  const [showModal, setShowModal] = useState(false);
  const [modalFeature, setModalFeature] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { currentVenueId } = useCurrentVenue();
  const user = getStoredUser();

  useEffect(() => {
    localStorage.setItem("activeMenuItem", activeMenuItem);
  }, [activeMenuItem]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMenuItemClick = (menuItem: string) => {
    if (IMPLEMENTED_MENUS.includes(menuItem)) {
      setActiveMenuItem(menuItem);
      setShowModal(false);
    } else if (menuItem !== "Tổng quan") {
      setModalFeature(menuItem);
      setShowModal(true);
    } else {
      setActiveMenuItem(menuItem);
      setShowModal(false);
    }

    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentVenueId");
    localStorage.setItem("logout_success", "true");
    window.location.href = PATHS.login;
  };

  const needsVenue =
    activeMenuItem !== "Đăng ký sân" &&
    activeMenuItem !== "Tổng quan" &&
    !currentVenueId;

  const renderContent = () => {
    if (needsVenue) {
      return (
        <div className="flex min-h-[calc(100vh-64px-40px)] items-center justify-center p-6">
          <EmptyState
            icon="📍"
            title="Chưa chọn sân"
            description="Vui lòng chọn sân ở menu bên trái hoặc tại mục Tổng quan để tiếp tục."
            actionLabel="Về Tổng quan"
            onAction={() => setActiveMenuItem("Tổng quan")}
          />
        </div>
      );
    }

    switch (activeMenuItem) {
      case "Quản lý sân":
        return <VenueManagementPage key={currentVenueId ?? "none"} />;
      case "Đăng ký sân":
        return <FieldRegister />;
      case "Lịch đặt sân":
        return <BookingSchedule key={currentVenueId ?? "none"} />;
      case "Quản lý nhân viên":
        return <VenueManagerList />;
      case "Tổng quan":
      default:
        return (
          <OverviewDashboard
            onNavigateRegister={
              user && isOwner(user)
                ? () => setActiveMenuItem("Đăng ký sân")
                : undefined
            }
            onNavigateSchedule={() => setActiveMenuItem("Lịch đặt sân")}
            onNavigateManagers={
              user && isOwner(user)
                ? () => setActiveMenuItem("Quản lý nhân viên")
                : undefined
            }
          />
        );
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-screen w-full bg-gradient-to-br from-[#EAFBEA] to-[#F0FDF0]",
      )}
    >
      <Sidebar
        activeMenuItem={activeMenuItem}
        onMenuItemClick={handleMenuItemClick}
        collapsed={sidebarCollapsed}
        isOpen={sidebarOpen}
        isMobile={isMobile}
        onToggle={toggleSidebar}
        onLogout={handleLogout}
        hideOwnerOnlyItems={user ? !isOwner(user) : false}
      />

      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-[2px]"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}

      <div
        className={cn(
          "flex min-h-screen flex-1 flex-col transition-all duration-300",
          isMobile
            ? "ml-0 w-full"
            : sidebarCollapsed
              ? "ml-20 w-[calc(100%-80px)]"
              : "ml-[280px] w-[calc(100%-280px)]",
          "max-md:ml-0 max-md:w-full",
        )}
      >
        <Header
          onToggleSidebar={toggleSidebar}
          isMobile={isMobile}
          sidebarCollapsed={sidebarCollapsed}
          pageTitle={activeMenuItem}
        />
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] pt-16">
          {renderContent()}
        </div>
      </div>
      {showModal && (
        <DevelopmentModal
          feature={modalFeature}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
