import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import { PlaceholderPage } from '@/components/product/PlaceholderPage';

export default function ReviewerDashboardPage() {
  return (
    <PlaceholderPage
      title="Dashboard"
      subtitle="Your review workload at a glance."
      icon={<DashboardOutlined sx={{ fontSize: 26 }} />}
      emptyTitle="Nothing to review yet"
      emptyMessage="When access reviews are assigned to you, they’ll surface here with what needs your attention first."
    />
  );
}
