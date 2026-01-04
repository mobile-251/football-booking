import './Sidebar.css'
import QLSIcon from '../../assets/QLS.svg'
import TQIcon from '../../assets/TQ.svg'
import DKSIcon from '../../assets/DKS.svg'
import LDSIcon from '../../assets/LDS.svg'
import DTIcon from '../../assets/DT.svg'
import BTIcon from '../../assets/BT.svg'
import TBIcon from '../../assets/TB.svg'
import BCIcon from '../../assets/BC.svg'


interface SidebarProps {
  activeMenuItem: string
  onMenuItemClick: (menuItem: string) => void
}

function Sidebar({ activeMenuItem, onMenuItemClick }: SidebarProps) {
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

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <div className="dashboard-icon active">
            <img src={TQIcon} alt="Dashboard" />
          </div>
          <div>
            <div className="dashboard-label">Dashboard</div>
            <div className="dashboard-subtitle">Quản lý sân</div>
          </div>
        </div>
        <button className="collapse-btn">‹</button>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`menu-item ${activeMenuItem === item.id ? 'active' : ''}`}
            onClick={() => onMenuItemClick(item.id)}
          >
            <span className="menu-icon">
                <img src={item.icon} alt={item.label} />
            </span>
            <span className="menu-label">{item.label}</span>
            {item.badge && (
              <span className="menu-badge">{item.badge}</span>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}

export default Sidebar