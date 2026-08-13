import SchemaOutlined from '@mui/icons-material/SchemaOutlined';
import { PlaceholderPage } from '@/components/product/PlaceholderPage';

/**
 * The Governance Explorer feature was removed; the nav entry stays so the route
 * keeps its place in the IA and can be rebuilt without re-teaching where it
 * lives. Uses the same PlaceholderPage as the other not-yet-built entries.
 *
 * The governance *data* (`@/data/governance*`) deliberately survives the
 * removal — the Applications detail page reads findings, approval hierarchy and
 * owner resolution from it, and none of that was explorer-specific.
 */
export default function GovernanceExplorerPage() {
  return (
    <PlaceholderPage
      title="Governance Model"
      subtitle="How organisation, access, controls and responsibility connect."
      icon={<SchemaOutlined sx={{ fontSize: 26 }} />}
      emptyTitle="Nothing to explore yet"
      emptyMessage="Entities, their relationships, and the governance gaps between them will surface here."
    />
  );
}
