import './Header.css'
import TBIcon from '../../assets/TB.svg'
import { useCurrentVenue } from '../../hooks/useCurrentVenue'
import { getRoleLabel, getStoredUser, isManager } from '../../types/auth'

interface HeaderProps {
  onToggleSidebar: () => void
  isMobile: boolean
}

function Header({ onToggleSidebar, isMobile }: HeaderProps) {
  const storedUser = getStoredUser()
  const fullName = storedUser?.fullName || 'Người dùng'
  const roleLabel = storedUser ? getRoleLabel(storedUser.role) : 'Người dùng'
  const { currentVenue } = useCurrentVenue()
  const venueSubtitle =
    storedUser && isManager(storedUser) && currentVenue ? currentVenue.name : ''

  return (
    <div className="header">
      <div className="header-main header-main--right">
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
              <div className="user-name">{fullName}</div>
              <div className="user-role">
                {roleLabel}
                {venueSubtitle ? ` · ${venueSubtitle}` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
