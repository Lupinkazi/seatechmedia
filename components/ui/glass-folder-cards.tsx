import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";
import {
  getWorkCategoryHref,
  type WorkCategory,
} from "../../src/data/work-categories";

interface GlassFolderProps {
  categories: readonly WorkCategory[];
  width: number;
}

interface PointerTweens {
  x: (value: number) => void;
  rotationX: (value: number) => void;
  rotationY: (value: number) => void;
}

function CategoryArtwork({
  category,
}: {
  category: WorkCategory;
}) {
  return (
    <img
      alt=""
      className="glass-folder__artwork glass-folder__artwork--photo"
      src={category.folderImage}
    />
  );
}

export function GlassFolder({ categories, width }: GlassFolderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dismissedRef = useRef(false);
  const folderRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const pointerTweensRef = useRef<PointerTweens[]>([]);
  const folderTiltRef = useRef<Pick<PointerTweens, "rotationX" | "rotationY"> | null>(
    null,
  );
  const pointerPositionRef = useRef({ x: 0, y: 0 });
  const pointerFrameRef = useRef<number | null>(null);
  const isExpanded = isOpen || isHovered;

  useEffect(() => {
    const folder = folderRef.current;
    if (!folder) return;

    const files = Array.from(
      folder.querySelectorAll<HTMLAnchorElement>(".glass-folder__file"),
    );
    const back = folder.querySelector<SVGElement>(".glass-folder__back");
    const front = folder.querySelector<HTMLButtonElement>(".glass-folder__front");
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const context = gsap.context(() => {
      gsap.set(folder, { transformPerspective: 1200 });

      const timeline = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out", duration: reducedMotion ? 0.12 : 0.74 },
      });

      const openLifts = [46, 36, 51, 32, 42];
      const openRotations = [-6, -3, 1, 4, 7];
      const restingRotations = [-7, -3.5, 1, 4, 7];
      files.forEach((file, index) => {
        timeline.fromTo(
          file,
          {
            yPercent: 0,
            rotation: restingRotations[index],
            opacity: 0.94,
            scale: index === 0 ? 1.025 : 1,
          },
          {
            yPercent: -openLifts[index],
            rotation: openRotations[index],
            opacity: 1,
            scale: index === 0 ? 1.045 : 1,
          },
          index * (reducedMotion ? 0.025 : 0.085),
        );
      });

      if (back) {
        timeline.fromTo(
          back,
          { y: 0, rotationX: 0 },
          { y: -4, rotationX: -1.5, duration: 0.7 },
          0,
        );
      }
      if (front) {
        timeline.fromTo(
          front,
          { y: 0, rotationX: 0 },
          { y: 4, rotationX: 0, duration: 0.68 },
          0,
        );
      }
      timelineRef.current = timeline;

      if (!reducedMotion) {
        pointerTweensRef.current = files.map((file) => ({
          x: gsap.quickTo(file, "x", { duration: 0.58, ease: "power3.out" }),
          rotationX: gsap.quickTo(file, "rotationX", {
            duration: 0.58,
            ease: "power3.out",
          }),
          rotationY: gsap.quickTo(file, "rotationY", {
            duration: 0.58,
            ease: "power3.out",
          }),
        }));
        folderTiltRef.current = {
          rotationX: gsap.quickTo(folder, "rotationX", {
            duration: 0.7,
            ease: "power3.out",
          }),
          rotationY: gsap.quickTo(folder, "rotationY", {
            duration: 0.7,
            ease: "power3.out",
          }),
        };
      }
    }, folder);

    return () => {
      if (pointerFrameRef.current !== null) {
        window.cancelAnimationFrame(pointerFrameRef.current);
      }
      timelineRef.current?.kill();
      timelineRef.current = null;
      pointerTweensRef.current = [];
      folderTiltRef.current = null;
      context.revert();
    };
  }, []);

  useEffect(() => {
    if (isExpanded) {
      timelineRef.current?.play();
    } else {
      timelineRef.current?.reverse();
    }
  }, [isExpanded]);

  const schedulePointerUpdate = () => {
    if (pointerFrameRef.current !== null) return;

    pointerFrameRef.current = window.requestAnimationFrame(() => {
      pointerFrameRef.current = null;
      const { x, y } = pointerPositionRef.current;
      const intensity = 1;

      pointerTweensRef.current.forEach((tweens, index) => {
        const depth = 0.6 + index * 0.08;
        tweens.x(x * 9 * depth);
        tweens.rotationX(-y * 2.2 * depth);
        tweens.rotationY(x * 3 * depth);
      });
      folderTiltRef.current?.rotationX(-y * 1.1 * intensity);
      folderTiltRef.current?.rotationY(x * 1.5 * intensity);
    });
  };

  const resetPointer = () => {
    pointerPositionRef.current = { x: 0, y: 0 };
    schedulePointerUpdate();
  };

  return (
    <div
      aria-label="Explore all SeaTechMedia services"
      className={`glass-folder${isExpanded ? " is-open" : ""}`}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        setIsOpen(false);
        dismissedRef.current = false;
      }}
      onFocus={(event) => {
        if (event.target === event.currentTarget && !dismissedRef.current) {
          setIsOpen(true);
        }
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !isExpanded) return;
        event.preventDefault();
        dismissedRef.current = true;
        setIsOpen(false);
        setIsHovered(false);
        folderRef.current?.focus();
      }}
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
        dismissedRef.current = false;
        setIsHovered(true);
      }}
      onPointerLeave={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          event.currentTarget.contains(event.relatedTarget)
        ) {
          return;
        }
        setIsHovered(false);
        resetPointer();
      }}
      onPointerMove={(event) => {
        if (
          (event.pointerType !== "mouse" && event.pointerType !== "pen") ||
          !isExpanded
        ) {
          return;
        }

        const bounds = event.currentTarget.getBoundingClientRect();
        pointerPositionRef.current = {
          x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
          y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
        };
        schedulePointerUpdate();
      }}
      ref={folderRef}
      role="group"
      style={{ width: `min(100%, ${width}px)` }}
      tabIndex={0}
    >
      <svg
        aria-hidden="true"
        className="glass-folder__back"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 560 424"
      >
        <defs>
          <linearGradient id="glass-folder-back-fill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#0b2035" stopOpacity=".78" />
            <stop offset=".68" stopColor="#102d48" stopOpacity=".9" />
            <stop offset="1" stopColor="#071728" stopOpacity=".84" />
          </linearGradient>
          <radialGradient id="glass-folder-back-glow" cx="78%" cy="12%" r="62%">
            <stop offset="0" stopColor="#06b6d4" stopOpacity=".22" />
            <stop offset="1" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="glass-folder-back-sheen" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity=".22" />
            <stop offset=".48" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="1" stopColor="#2563eb" stopOpacity=".1" />
          </linearGradient>
        </defs>
        <path
          className="glass-folder__back-shape"
          d="M 32 168 Q 32 148 52 148 H 72 V 121 Q 72 99 94 99 H 260 Q 282 99 282 121 V 148 H 500 Q 528 148 528 176 V 384 Q 528 416 496 416 H 64 Q 32 416 32 384 Z"
        />
        <path
          className="glass-folder__back-gloss"
          d="M 32 168 Q 32 148 52 148 H 72 V 121 Q 72 99 94 99 H 260 Q 282 99 282 121 V 148 H 500 Q 528 148 528 176 V 384 Q 528 416 496 416 H 64 Q 32 416 32 384 Z"
        />
        <path
          className="glass-folder__back-rim"
          d="M 40 169 Q 40 156 54 156 H 80 V 121 Q 80 107 95 107 H 259 Q 274 107 274 122 V 156 H 500 Q 520 156 520 176 V 382 Q 520 408 494 408 H 66 Q 40 408 40 382 Z"
        />
      </svg>
      <span aria-hidden="true" className="glass-folder__sheet-slot" />

      <div
        aria-hidden={!isExpanded}
        className="glass-folder__files"
        id="service-folder-categories"
      >
        {categories.map((category, index) => (
          <a
            aria-label={
              category.externalHref
                ? `Open ${category.label} project in a new tab. ${category.shortDescription}`
                : `View ${category.label} work in Our Work. ${category.shortDescription}`
            }
            className="glass-folder__file"
            data-category={category.id}
            data-work-category-link
            href={getWorkCategoryHref(category)}
            key={category.id}
            tabIndex={isExpanded ? 0 : -1}
            target={category.externalHref ? "_blank" : undefined}
            rel={category.externalHref ? "noopener noreferrer" : undefined}
            style={
              {
                "--sheet-order": index,
                "--sheet-delay": `${Math.min(index * 85, 340)}ms`,
              } as CSSProperties
            }
          >
            <span className="glass-folder__artwork-well">
              <CategoryArtwork category={category} />
            </span>
            <span className="glass-folder__file-copy">
              <strong>{category.label}</strong>
            </span>
            <span aria-hidden="true" className="glass-folder__file-glint" />
          </a>
        ))}
      </div>

      <button
        aria-controls="service-folder-categories"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Close services folder" : "Open services folder"}
        className="glass-folder__front"
        onClick={() => {
          dismissedRef.current = false;
          setIsOpen((open) => !open);
        }}
        type="button"
      >
        <span aria-hidden="true" className="glass-folder__tint" />
        <span aria-hidden="true" className="glass-folder__spec" />
        <span className="glass-folder__label">
          <span className="glass-folder__instruction-desktop">
            Hover to explore our services
          </span>
          <span className="glass-folder__instruction-mobile">
            Tap to explore our services
          </span>
        </span>
        <span aria-hidden="true" className="glass-folder__front-rim" />
        <span aria-hidden="true" className="glass-folder__hit" />
      </button>
    </div>
  );
}
