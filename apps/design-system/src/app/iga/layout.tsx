import ProductSidebar from '@/components/product/ProductSidebar';
import ProductTopbar from '@/components/product/ProductTopbar';
import AppFrame from '@/components/product/AppFrame';
import { PersonaProvider } from '@/lib/persona';
import { SidebarProvider } from '@/lib/sidebar';
import { BreadcrumbProvider } from '@/lib/breadcrumb';

// The IGA product shell — dark navigation rail + product top bar.
export default function IgaLayout({ children }: { children: React.ReactNode }) {
  return (
    <PersonaProvider>
      <SidebarProvider>
        <BreadcrumbProvider>
          <ProductSidebar />
          {/* Fixed-height app frame: the shell doesn't scroll — pages manage their own
              overflow (content pages scroll here; full-height list pages fill and scroll
              their table internally). Padding: 32px L/R, 24px T/B. The left margin tracks
              the rail's collapsed width via AppFrame. */}
          <AppFrame>
            <ProductTopbar />
            <main className="ds-scroll flex-1 overflow-y-auto px-8 py-6">{children}</main>
          </AppFrame>
        </BreadcrumbProvider>
      </SidebarProvider>
    </PersonaProvider>
  );
}
