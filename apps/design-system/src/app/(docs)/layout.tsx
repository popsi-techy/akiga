import Sidebar from '@/components/shell/Sidebar';
import Topbar from '@/components/shell/Topbar';

// The Design System docs shell — light sidebar + docs top bar.
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <div
        className="ml-[260px] flex min-h-screen flex-col"
        style={{ ['--ds-shell-content-inset' as string]: '260px' }}
      >
        <Topbar />
        <main className="ds-scroll flex-1 px-8 py-10">
          <div className="mx-auto max-w-4xl">{children}</div>
        </main>
      </div>
    </>
  );
}
