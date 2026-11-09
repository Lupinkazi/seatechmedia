import * as React from "react";
import gsap from "gsap";
import { cardPose, clamp01, deckAdvance, fallAngle, poolSize, slotIndex, wrap, type Pose } from "./tumble-deck-math";
import { WORK_IMAGE_SIZES } from "../../lib/work-images";

/*
 * Tumble Deck Showcase — a stack of pictures standing on edge, one behind the
 * other. The front card tips forward on its bottom edge and lands flat on the
 * floor, the deck slides up to the line, the next one falls. It never runs out:
 * after the last card the first one is standing behind it again.
 *
 * Pure CSS 3D with one number driving it (the deck position). A small pool of
 * card elements is recycled along it. While the pointer is over the deck it
 * flips by itself, slowly; leaving the deck pauses it, entering resumes it.
 */

export type TumbleCard = {
  src: string;
  alt?: string;
  srcSet?: string;
  sizes?: string;
};

export type TumbleDeckShowcaseProps = {
  cards: TumbleCard[];
  height?: number | string;
  /** Card width ÷ height. Images are cropped to it. */
  aspect?: number;
  /** How many upright cards show behind the front one. */
  depth?: number;
  /** Milliseconds between automatic flips while the pointer is over the deck. */
  autoplayMs?: number;
  background?: string;
  className?: string;
  ariaLabel?: string;
};

export { clamp01, wrap, fallAngle, deckAdvance, cardPose, type Pose };

export default function TumbleDeckShowcase({
  cards,
  height = "clamp(440px, 54vw, 720px)",
  aspect = 2.06,
  depth = 5,
  autoplayMs = 1700,
  background = "transparent",
  className,
  ariaLabel = "Project showcase",
}: TumbleDeckShowcaseProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const sceneRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const imgRefs = React.useRef<(HTMLImageElement | null)[]>([]);
  const slotK = React.useRef<number[]>([]);
  const state = React.useRef({ pos: 0 });
  const geo = React.useRef({ h: 200, gap: 44 });
  const n = cards.length;
  const pool = poolSize(n, depth);

  const paint = React.useCallback(() => {
    const { pos } = state.current;
    const { gap } = geo.current;
    cardRefs.current.forEach((el, j) => {
      const img = imgRefs.current[j];
      if (!el || !img || j >= pool) return;
      const k = slotIndex(j, pos, pool, n);
      const p = cardPose(k, pos, depth);
      if (slotK.current[j] !== k && p.opacity > 0) {
        slotK.current[j] = k;
        const c = cards[wrap(k, n)];
        img.sizes = c.sizes ?? WORK_IMAGE_SIZES;
        img.srcset = c.srcSet ?? "";
        img.src = c.src;
        img.alt = c.alt ?? "";
      }
      el.style.transform = `translate3d(0, ${-p.lift}px, ${p.z * gap}px) rotateX(${p.angle}deg)`;
      el.style.opacity = String(p.opacity);
      el.style.visibility = p.opacity > 0 ? "visible" : "hidden";
      el.style.setProperty("--td-shade", String(p.flat ? 0.06 : (-p.angle / 90) * 0.06));
    });
  }, [depth, pool, cards, n]);

  React.useLayoutEffect(() => {
    slotK.current = [];
  }, [cards]);

  React.useLayoutEffect(() => {
    const root = rootRef.current;
    const scene = sceneRef.current;
    if (!root || !scene) return;
    const fit = () => {
      const W0 = root.clientWidth;
      const H0 = root.clientHeight;
      const wFrac = W0 < 420 ? 0.76 : 0.655;
      const h = Math.max(60, Math.min((W0 * wFrac) / aspect, H0 * 0.42, 620));
      const top = H0 / 2 - 0.62 * h;
      geo.current = { h, gap: 0.24 * h };
      scene.style.perspective = `${6 * h}px`;
      scene.style.perspectiveOrigin = `50% ${top - 1.66 * h}px`;
      root.style.setProperty("--td-w", `${h * aspect}px`);
      root.style.setProperty("--td-h", `${h}px`);
      root.style.setProperty("--td-top", `${top}px`);
      paint();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(root);
    return () => ro.disconnect();
  }, [aspect, paint]);

  const api = React.useRef<{ step: (dir: 1 | -1) => void }>({ step: () => {} });
  const dragged = React.useRef(false);
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || n <= 1) return;
    const s = state.current;
    let target = s.pos;
    let running = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const follow = () => {
      const dt = gsap.ticker.deltaRatio(60) / 60;
      s.pos += (target - s.pos) * (1 - Math.exp(-dt * 5.5));
      if (Math.abs(target - s.pos) < 2e-3) {
        s.pos = target;
        gsap.ticker.remove(follow);
        running = false;
      }
      paint();
    };
    const push = (to: number) => {
      target = Math.max(Math.round(s.pos) - 3, Math.min(Math.round(s.pos) + 3, to));
      if (!running) {
        running = true;
        gsap.ticker.add(follow);
      }
    };
    api.current.step = (dir) => push(Math.round(target) + dir);

    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };
    const start = () => {
      if (timer) return;
      timer = setInterval(() => push(Math.round(target) + 1), autoplayMs);
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") start();
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") stop();
    };

    let drag: { id: number; y: number; travel: number; last: number } | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      drag = { id: e.pointerId, y: e.clientY, travel: 0, last: 0 };
      dragged.current = false;
    };
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dy = drag.y - e.clientY;
      drag.y = e.clientY;
      drag.travel += Math.abs(dy);
      if (dy) drag.last = Math.sign(dy);
      if (drag.travel > 6 && !dragged.current) {
        dragged.current = true;
        root.setPointerCapture(e.pointerId);
      }
      if (dragged.current) push(target + dy / (geo.current.h * 1.1));
    };
    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (dragged.current) push(drag.last > 0 ? Math.floor(target + 0.7) : drag.last < 0 ? Math.ceil(target - 0.7) : Math.round(target));
      drag = null;
    };

    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onUp);
    paint();
    return () => {
      stop();
      gsap.ticker.remove(follow);
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onUp);
    };
  }, [n, autoplayMs, paint]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " " || e.key === "Enter") {
      e.preventDefault();
      api.current.step(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      api.current.step(-1);
    }
  };

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={onKey}
      onClick={() => {
        if (!dragged.current) api.current.step(1);
      }}
      className={["td-root relative w-full overflow-hidden outline-none select-none", className].filter(Boolean).join(" ")}
      style={{ height, background, touchAction: "pan-y" }}
    >
      <style>{`
        .td-scene { position: absolute; inset: 0; transform-style: preserve-3d; }
        .td-card {
          position: absolute; left: 50%; top: var(--td-top);
          width: var(--td-w); height: var(--td-h); margin-left: calc(var(--td-w) / -2);
          transform-origin: 50% 100%; transform-style: preserve-3d;
          backface-visibility: visible; will-change: transform;
          border-radius: 6px; overflow: hidden; cursor: pointer;
          background: #e5e7eb;
          box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.1);
        }
        .td-card img {
          display: block; width: 100%; height: 100%; max-width: none;
          object-fit: cover; pointer-events: none;
        }
        .td-card::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: #000; opacity: var(--td-shade, 0);
        }
        .td-root:focus-visible { box-shadow: inset 0 0 0 2px #2563eb; }
      `}</style>
      <div ref={sceneRef} className="td-scene">
        {Array.from({ length: pool }, (_, j) => (
          <div
            key={j}
            ref={(el) => {
              cardRefs.current[j] = el;
            }}
            className="td-card"
          >
            <img
              ref={(el) => {
                imgRefs.current[j] = el;
              }}
              alt=""
              width={720}
              height={Math.round(720 / aspect)}
              draggable={false}
              decoding="async"
              loading="lazy"
            />
          </div>
        ))}
      </div>
      <span className="sr-only" aria-live="polite">
        {n} pictures. Hover to flip automatically, or click, drag or use the arrow keys.
      </span>
    </div>
  );
}
