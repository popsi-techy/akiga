import styles from './flow-canvas.module.css';

/**
 * Layout-only vertical spacer. The SVG overlay draws the stroke — product code
 * must never paint its own `border-l` stems. Use this between a card and a chip
 * (Fallback Approver) or inside a sealed lane body.
 */
export function FlowStem({ height = 20 }: { height?: number }) {
  return <div data-flow-vseg aria-hidden className={styles.vseg} style={{ height }} />;
}
