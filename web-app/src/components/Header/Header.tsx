import './Header.css'
import TBIcon from '../../assets/TB.svg'

interface HeaderProps {
  onToggleSidebar: () => void
  isMobile: boolean
}

function Header({ onToggleSidebar, isMobile }: HeaderProps) {
  return (
    <div className="header">
      <div className="header-main header-main--right">
        {/* Hamburger button for mobile */}
        {isMobile && (
          <button className="hamburger-btn" onClick={onToggleSidebar}>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        )}

        <div className="header-right">
          <div className="notification-icon-container">
            <span className="notification-icon">
              <img src={TBIcon} alt="Notification" />
            </span>
            <span className="notification-badge">5</span>
          </div>

          <div className="user-info">
            <div className="user-avatar">
              <span className="avatar-icon">👤</span>
            </div>
            <div className="user-details">
              <div className="user-name">Nguyễn Văn B</div>
              <div className="user-role">Chủ sân</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
