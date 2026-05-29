import { useCurrentVenue } from '../../hooks/useCurrentVenue';
import { isOwner, isManager } from '../../types/auth';
import './OverviewDashboard.css';

interface OverviewDashboardProps {
  onNavigateRegister?: () => void;
}

function OverviewDashboard({ onNavigateRegister }: OverviewDashboardProps) {
  const {
    venues,
    currentVenue,
    currentVenueId,
    setCurrentVenueId,
    isLoading,
    user,
  } = useCurrentVenue();

  if (isLoading) {
    return (
      <div className="overview-dashboard">
        <p>Đang tải...</p>
      </div>
    );
  }

  if (user && isOwner(user) && venues.length === 0) {
    return (
      <div className="overview-dashboard">
        <div className="overview-empty-banner">
          <h2>Chưa có sân nào</h2>
          <p>Bắt đầu bằng cách đăng ký sân đầu tiên của bạn.</p>
          {onNavigateRegister && (
            <button type="button" className="overview-cta" onClick={onNavigateRegister}>
              Đăng ký sân
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="overview-dashboard">
      <h2>Tổng quan</h2>
      <p className="overview-welcome">
        Chào {user?.fullName}, {isManager(user) ? 'quản lý' : 'chủ sân'}{' '}
        {currentVenue ? `— ${currentVenue.name}` : ''}
      </p>

      {currentVenue && (
        <div className="overview-current-card">
          <h3>Sân đang quản lý</h3>
          <p className="venue-name">{currentVenue.name}</p>
          <p className="venue-address">{currentVenue.address}</p>
          {currentVenue.city && (
            <p className="venue-city">
              {currentVenue.district ? `${currentVenue.district}, ` : ''}
              {currentVenue.city}
            </p>
          )}
        </div>
      )}

      {user && isOwner(user) && venues.length > 1 && (
        <div className="overview-venue-grid">
          <h3>Chọn sân làm việc</h3>
          <div className="venue-cards">
            {venues.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`venue-card ${v.id === currentVenueId ? 'active' : ''}`}
                onClick={() => setCurrentVenueId(v.id)}
              >
                <span className="venue-card-name">{v.name}</span>
                <span className="venue-card-address">{v.address}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="overview-stats-placeholder">
        <p>Thống kê doanh thu và lịch đặt sẽ có trong phiên bản tiếp theo.</p>
      </div>
    </div>
  );
}

export default OverviewDashboard;
