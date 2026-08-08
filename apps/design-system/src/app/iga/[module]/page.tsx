import Link from 'next/link';
import { navForPersona, flattenLeaves } from '@/lib/iga-navigation';
import { Card, Button } from '@ds/components';

// Placeholder for IGA modules not yet built. Dashboard has its own explicit route.
export default function ModulePlaceholder({ params }: { params: { module: string } }) {
  const item = flattenLeaves(navForPersona.admin).find(
    (i) => i.id === params.module || i.href === `/iga/${params.module}`,
  );
  const label = item?.label ?? params.module.replace(/-/g, ' ');

  return (
    <div className="mx-auto max-w-2xl py-16">
      <h1 className="text-h2 text-text-primary">{label}</h1>
      <p className="mt-2 text-body text-text-secondary">
        This module isn’t built yet. The Dashboard is the first screen assembled from the Design
        System — the rest follow, each screen pulling any new components or patterns back into the
        Design System first.
      </p>
      <Card className="mt-6 p-6">
        <div className="text-body-strong text-text-primary">Coming next</div>
        <p className="mt-1 text-body-sm text-text-secondary">
          {label} will reuse the same shell, tables, cards, chips, and overlays already in the
          system.
        </p>
        <div className="mt-4">
          <Link href="/iga/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
