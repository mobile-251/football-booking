import { VenueProvider } from '../../contexts/CurrentVenueContext';
import DashboardLayout from './DashboardLayout';

export default function DashboardPage() {
  return (
    <VenueProvider>
      <DashboardLayout />
    </VenueProvider>
  );
}
