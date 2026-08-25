import { AtmosphericBackground } from '@/components/atmosphere/AtmosphericBackground';

/**
 * Isolated comparison for the white / sky-blue circular atmosphere.
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
