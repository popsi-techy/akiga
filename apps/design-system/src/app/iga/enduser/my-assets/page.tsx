import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import { PlaceholderPage } from '@/components/product/PlaceholderPage';

export default function MyAssetsPage() {
  return (
    <PlaceholderPage
      title="My Assets"
      subtitle="Applications, entitlements, and roles assigned to you."
      icon={<Inventory2Outlined sx={{ fontSize: 26 }} />}
      emptyTitle="No assets yet"
      emptyMessage="Once access is granted to you, your applications, entitlements, and roles will be listed here."
    />
  );
}
