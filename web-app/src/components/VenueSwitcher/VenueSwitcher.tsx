import { useCurrentVenue } from '../../hooks/useCurrentVenue';
import { isOwner } from '../../types/auth';
import './VenueSwitcher.css';

function VenueSwitcher() {
  const { venues, currentVenueId, setCurrentVenueId, user } = useCurrentVenue();

  if (!user || !isOwner(user) || venues.length <= 1) {
    return null;
  }

  return (
    <div className="venue-switcher">
      <label className="venue-switcher-label" htmlFor="venue-select">
        Sân đang quản lý
      </label>
      <select
        id="venue-select"
        className="venue-switcher-select"
        value={currentVenueId ?? ''}
        onChange={(e) => setCurrentVenueId(Number(e.target.value))}
      >
        {venues.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default VenueSwitcher;
