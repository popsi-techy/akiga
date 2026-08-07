import type { Metadata } from 'next';
import '@fontsource-variable/dm-sans';
import './globals.css';
import ThemeRegistry from '@ds/theme/ThemeRegistry';
import { rootCssVariables } from '@ds/theme/cssVars';
import { ToastProvider } from '@ds/components';

export const metadata: Metadata = {
  title: 'akiga · Design System & IGA',
  description:
    'The akiga Design System (a living product) and the IGA Product built entirely from it.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Token CSS variables — generated from tokens.ts (single source of truth). */}
        <style dangerouslySetInnerHTML={{ __html: rootCssVariables() }} />
      </head>
      <body>
        <ThemeRegistry>
          <ToastProvider>{children}</ToastProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
