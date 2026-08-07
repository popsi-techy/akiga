import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import { PlaceholderPage } from '@/components/product/PlaceholderPage';

export default function EndUserDashboardPage() {
  return (
    <PlaceholderPage
      title="Dashboard"
      subtitle="Your access at a glance."
      icon={<DashboardOutlined sx={{ fontSize: 26 }} />}
      emptyTitle="Your dashboard is being set up"
      emptyMessage="Requests, approvals, and the access assigned to you will show up here."
    />
  );
}
