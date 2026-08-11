/**
 * FlowCanvas measured-SVG edge geometry (ADR-0007).
 *
 * The DOM lays out cards and lanes; this module turns measured anchors into
 * orthogonal path `d` strings. Coordinates are stage-local (unscaled).
 */

export type Point = { x: number; y: number };

/** Snap to half-pixels so 2px strokes stay crisp under CSS zoom. */
export function snap(n: number): number {
  return Math.round(n * 2) / 2;
}

export function snapPoint(p: Point): Point {
  return { x: snap(p.x), y: snap(p.y) };
}

/** Convert a getBoundingClientRect point into stage-local coords. */
export function toStage(
  clientX: number,
  clientY: number,
  stageRect: DOMRect,
  zoom: number,
): Point {
  const z = zoom || 1;
  return snapPoint({
    x: (clientX - stageRect.left) / z,
    y: (clientY - stageRect.top) / z,
  });
}

export function elPoint(
  el: Element,
  stageRect: DOMRect,
  zoom: number,
  where: 'top' | 'bottom' | 'center',
): Point {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy =
    where === 'top' ? r.top : where === 'bottom' ? r.bottom : r.top + r.height / 2;
  return toStage(cx, cy, stageRect, zoom);
}

/**
 * Vertical segment (sequence connector / stem spacer).
 * `M x top V bottom`
 */
export function verticalSeg(top: Point, bottom: Point): string {
  const a = snapPoint(top);
  const b = snapPoint(bottom);
  if (Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5) return '';
  // Prefer a true vertical; use the average x if the slot drifted a hair.
  const x = snap((a.x + b.x) / 2);
  return `M ${x} ${a.y} V ${b.y}`;
}

/**
 * Fan-out from a parent entry down to N lane heads.
 * Trunk drops to a bus, bus spans outer heads, each lane drops from the bus.
 * Outer lanes get a radius.md-sized elbow so the turn reads as one stroke.
 */
export function fanOutPath(entry: Point, heads: Point[], radius = 8): string {
  if (heads.length === 0) return '';
  const e = snapPoint(entry);
  const hs = heads.map(snapPoint).sort((a, b) => a.x - b.x);

  if (hs.length === 1) {
    const h = hs[0];
    const x = snap((e.x + h.x) / 2);
    return `M ${x} ${e.y} V ${h.y}`;
  }

  // Bus sits at the top of the lane pads (= entry + 20 layout), but prefer the
  // measured head Y minus the pad so asymmetric measure noise doesn't break it.
  const busY = snap(Math.min(...hs.map((h) => h.y)) - 20);
  const by = Number.isFinite(busY) ? busY : snap(e.y + 20);
  const r = Math.min(radius, 8);
  const left = hs[0];
  const right = hs[hs.length - 1];

  const parts: string[] = [];
  // Trunk into the bus.
  parts.push(`M ${e.x} ${e.y} V ${by}`);
  // Horizontal bus between elbow starts.
  const busLeft = snap(left.x + r);
  const busRight = snap(right.x - r);
  if (busRight > busLeft) parts.push(`M ${busLeft} ${by} H ${busRight}`);

  for (let i = 0; i < hs.length; i++) {
    const h = hs[i];
    const isFirst = i === 0;
    const isLast = i === hs.length - 1;
    if (isFirst) {
      // Elbow: arrive from the right along the bus, turn down.
      parts.push(
        `M ${busLeft} ${by} Q ${left.x} ${by} ${left.x} ${snap(by + r)} V ${h.y}`,
      );
    } else if (isLast) {
      parts.push(
        `M ${busRight} ${by} Q ${right.x} ${by} ${right.x} ${snap(by + r)} V ${h.y}`,
      );
    } else {
      parts.push(`M ${h.x} ${by} V ${h.y}`);
    }
  }
  return parts.join(' ');
}

/**
 * Merge from N lane feet up into a single exit below.
 * Mirror of fan-out. `feet` are measured at the **top** of each lane-foot pad;
 * the lane spacer’s `data-flow-vseg` strokes down to that point, and this path
 * owns the foot drop + bus + exit (no overlapping segment with the spacer).
 */
export function mergePath(feet: Point[], exit: Point, radius = 8): string {
  if (feet.length === 0) return '';
  const ex = snapPoint(exit);
  const fs = feet.map(snapPoint).sort((a, b) => a.x - b.x);

  if (fs.length === 1) {
    const f = fs[0];
    const x = snap((f.x + ex.x) / 2);
    return `M ${x} ${f.y} V ${ex.y}`;
  }

  const busY = snap(Math.max(...fs.map((f) => f.y)) + 20);
  const by = Number.isFinite(busY) ? busY : snap(ex.y - 20);
  const r = Math.min(radius, 8);
  const left = fs[0];
  const right = fs[fs.length - 1];
  const busLeft = snap(left.x + r);
  const busRight = snap(right.x - r);

  const parts: string[] = [];
  for (let i = 0; i < fs.length; i++) {
    const f = fs[i];
    const isFirst = i === 0;
    const isLast = i === fs.length - 1;
    if (isFirst) {
      parts.push(
        `M ${f.x} ${f.y} V ${snap(by - r)} Q ${left.x} ${by} ${busLeft} ${by}`,
      );
    } else if (isLast) {
      parts.push(
        `M ${f.x} ${f.y} V ${snap(by - r)} Q ${right.x} ${by} ${busRight} ${by}`,
      );
    } else {
      parts.push(`M ${f.x} ${f.y} V ${by}`);
    }
  }
  if (busRight > busLeft) parts.push(`M ${busLeft} ${by} H ${busRight}`);
  parts.push(`M ${ex.x} ${by} V ${ex.y}`);
  return parts.join(' ');
}

export type EdgeModel = {
  width: number;
  height: number;
  paths: string[];
};

/**
 * Walk the stage DOM for data-flow-* anchors and build the SVG path list.
 * Safe to call every frame; returns an empty model when the stage is missing.
 */
export function buildEdgeModel(stage: HTMLElement | null, zoom: number): EdgeModel {
  if (!stage) return { width: 0, height: 0, paths: [] };
  const stageRect = stage.getBoundingClientRect();
  const paths: string[] = [];

  // Sequence connectors + stem spacers (including product FlowStem placeholders).
  stage.querySelectorAll('[data-flow-vseg]').forEach((el) => {
    const top = elPoint(el, stageRect, zoom, 'top');
    const bottom = elPoint(el, stageRect, zoom, 'bottom');
    const d = verticalSeg(top, bottom);
    if (d) paths.push(d);
  });

  // Branch tiers: fan-out + optional merge.
  stage.querySelectorAll('[data-flow-tier]').forEach((tier) => {
    const merges = (tier as HTMLElement).dataset.merges === 'true';
    const entry = elPoint(tier, stageRect, zoom, 'top');
    const laneEls = tier.querySelectorAll(':scope > [data-flow-lanes] > [data-flow-lane]');
    const heads: Point[] = [];
    const feet: Point[] = [];
    laneEls.forEach((lane) => {
      const head = lane.querySelector(':scope > [data-flow-lane-head]');
      if (head) heads.push(elPoint(head, stageRect, zoom, 'bottom'));
      const terminal = (lane as HTMLElement).dataset.terminal === 'true';
      if (!terminal) {
        const foot = lane.querySelector(':scope > [data-flow-lane-foot]');
        // Top of the foot pad — spacer vseg ends here; merge draws the foot drop.
        if (foot) feet.push(elPoint(foot, stageRect, zoom, 'top'));
      }
    });
    const fan = fanOutPath(entry, heads, 8);
    if (fan) paths.push(fan);
    if (merges && feet.length > 0) {
      const exitPad = tier.querySelector(':scope > [data-flow-tier-exit]');
      const exit = exitPad
        ? elPoint(exitPad, stageRect, zoom, 'bottom')
        : elPoint(tier, stageRect, zoom, 'bottom');
      const merge = mergePath(feet, exit, 8);
      if (merge) paths.push(merge);
    }
  });

  return {
    width: Math.max(stage.scrollWidth, stage.offsetWidth),
    height: Math.max(stage.scrollHeight, stage.offsetHeight),
    paths,
  };
}

/**
 * Orthogonal polyline through an ordered list of simulation markers
 * (`data-flow-sim-node`). Used for the Test Run trace overlay.
 */
export function buildSimTrace(stage: HTMLElement | null, zoom: number, nodeIds: string[]): string {
  if (!stage || nodeIds.length < 2) return '';
  const stageRect = stage.getBoundingClientRect();
  const pts: Point[] = [];
  for (const id of nodeIds) {
    const el = stage.querySelector(`[data-flow-sim-node="${id}"]`);
    if (!el) continue;
    // Prefer bottom of prior / top of next feel: use center for a clean trunk.
    pts.push(elPoint(el, stageRect, zoom, 'center'));
  }
  if (pts.length < 2) return '';

  const parts: string[] = [];
  parts.push(`M ${pts[0].x} ${pts[0].y}`);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    // Orthogonal: vertical then horizontal (or straight vertical when aligned).
    if (Math.abs(a.x - b.x) < 0.5) {
      parts.push(`V ${b.y}`);
    } else if (Math.abs(a.y - b.y) < 0.5) {
      parts.push(`H ${b.x}`);
    } else {
      const midY = snap((a.y + b.y) / 2);
      parts.push(`V ${midY} H ${b.x} V ${b.y}`);
    }
  }
  return parts.join(' ');
}
