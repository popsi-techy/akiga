import { AtmosphericBackground } from '@/components/atmosphere/AtmosphericBackground';

/**
 * Isolated comparison for the CSS/SVG grey atmosphere.
 * Open /atmospheric-background next to the reference crop.
 */
export default function AtmosphericBackgroundDemo() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas p-8">
      <div
        className="relative overflow-hidden"
        style={{ width: 420, height: 650, borderRadius: 24 }}
      >
        <AtmosphericBackground />
      </div>
    </div>
  );
}
