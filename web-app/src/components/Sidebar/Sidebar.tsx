import './Sidebar.css'
import QLSIcon from '../../assets/QLS.svg'
import TQIcon from '../../assets/TQ.svg'
import DKSIcon from '../../assets/DKS.svg'
import LDSIcon from '../../assets/LDS.svg'
import DTIcon from '../../assets/DT.svg'
import BTIcon from '../../assets/BT.svg'
import TBIcon from '../../assets/TB.svg'
import BCIcon from '../../assets/BC.svg'
import DarkIcon from '../../assets/Dark.svg'
import LogOutIcon from '../../assets/LogOut.svg'

interface SidebarProps {
  activeMenuItem: string
  onMenuItemClick: (menuItem: string) => void
  collapsed: boolean
  isOpen: boolean
  isMobile: boolean
  onToggle: () => void
  onLogout: () => void
}

function Sidebar({
  activeMenuItem,
  onMenuItemClick,
  collapsed,
  isOpen,
  isMobile,
  onToggle,
  onLogout
}: SidebarProps) {
  const menuItems = [
    { id: 'Tổng quan', icon: TQIcon, label: 'Tổng quan' },
    { id: 'Quản lý sân', icon: QLSIcon, label: 'Quản lý sân' },
    { id: 'Đăng ký sân', icon: DKSIcon, label: 'Đăng ký sân' },
    { id: 'Lịch đặt sân', icon: LDSIcon, label: 'Lịch đặt sân' },
    { id: 'Doanh thu', icon: DTIcon, label: 'Doanh thu' },
    { id: 'Bảo trì', icon: BTIcon, label: 'Bảo trì' },
    { id: 'Thông báo', icon: TBIcon, label: 'Thông báo', badge: 5 },
    { id: 'Báo cáo', icon: BCIcon, label: 'Báo cáo' },
  ]

  const sidebarClasses = [
    'sidebar',
    collapsed && !isMobile ? 'collapsed' : '',
    isMobile && isOpen ? 'open' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={sidebarClasses}>

      <div className="sidebar-header">
        <div className="sidebar-title" onClick={() => onMenuItemClick('Tổng quan')} style={{ cursor: 'pointer' }}>
          <div className="dashboard-icon active">
            <img src={TQIcon} alt="Dashboard" />
          </div>
          {(!collapsed || isMobile) && (
            <div>
              <div className="dashboard-label">Dashboard</div>
              <div className="dashboard-subtitle">Quản lý sân</div>
            </div>
          )}
        </div>
        {/* {!isMobile && (
          <button className="collapse-btn" onClick={onToggle} title={collapsed ? "Mở rộng" : "Thu gọn"}>
            {collapsed ? '›' : '‹'}
          </button>
        )} */}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`menu-item ${activeMenuItem === item.id ? 'active' : ''}`}
            onClick={() => onMenuItemClick(item.id)}
            title={collapsed ? item.label : ''}
          >
            <span className="menu-icon">
              <img src={item.icon} alt={item.label} />
            </span>
            {!collapsed && <span className="menu-label">{item.label}</span>}
            {item.badge && !collapsed && (
              <span className="menu-badge">{item.badge}</span>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div
          className="sidebar-footer-item"
          title={collapsed ? "Chế độ tối" : ''}
          onClick={() => onMenuItemClick('Chế độ tối')}
        >
          <span className="menu-icon">
            <img src={DarkIcon} alt="Dark mode" />
          </span>
          {!collapsed && <span className="menu-label">Chế độ tối</span>}
        </div>

        <div
          className="sidebar-footer-item logout"
          title={collapsed ? "Đăng xuất" : ''}
          onClick={onLogout}
        >
          <span className="menu-icon">
            <img src={LogOutIcon} alt="Logout" />
          </span>
          {!collapsed && <span className="menu-label">Đăng xuất</span>}
        </div>
      </div>
    </div>
  )
}

export default Sidebar