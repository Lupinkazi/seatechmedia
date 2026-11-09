import { useEffect, useRef } from "react";
import {
  Body,
  Bodies,
  Composite,
  Constraint,
  Engine,
  Events,
  type Body as MatterBody,
} from "matter-js";
import blackmagicMark from "simple-icons/icons/blackmagicdesign.svg?raw";
import djiMark from "simple-icons/icons/dji.svg?raw";
import githubMark from "simple-icons/icons/github.svg?raw";
import gsapMark from "simple-icons/icons/gsap.svg?raw";
import javascriptMark from "simple-icons/icons/javascript.svg?raw";
import nextMark from "simple-icons/icons/nextdotjs.svg?raw";
import nodeMark from "simple-icons/icons/nodedotjs.svg?raw";
import reactMark from "simple-icons/icons/react.svg?raw";
import tailwindMark from "simple-icons/icons/tailwindcss.svg?raw";
import threeMark from "simple-icons/icons/threedotjs.svg?raw";
import typescriptMark from "simple-icons/icons/typescript.svg?raw";
import {
  TECHNOLOGY_SPHERES,
  type TechnologyMark,
} from "../data/technology-bubbles";

const SIMPLE_MARKS: Partial<Record<TechnologyMark, { svg: string; color: string }>> = {
  blackmagicdesign: { svg: blackmagicMark, color: "#FFA200" },
  dji: { svg: djiMark, color: "#f7f7f5" },
  github: { svg: githubMark, color: "#f7f7f5" },
  gsap: { svg: gsapMark, color: "#0AE448" },
  javascript: { svg: javascriptMark, color: "#F7DF1E" },
  nextjs: { svg: nextMark, color: "#f7f7f5" },
  nodejs: { svg: nodeMark, color: "#5FA04E" },
  react: { svg: reactMark, color: "#61DAFB" },
  tailwind: { svg: tailwindMark, color: "#06B6D4" },
  threejs: { svg: threeMark, color: "#f7f7f5" },
  typescript: { svg: typescriptMark, color: "#3178C6" },
};

const IMAGE_MARKS: Partial<Record<TechnologyMark, string>> = {
  aftereffects: "/assets/technology/aftereffects.svg",
  blender: "/assets/technology/blender.svg",
  canon: "/assets/technology/canon.svg",
  photoshop: "/assets/technology/photoshop.svg",
  premierepro: "/assets/technology/premierepro.svg",
  python: "/assets/technology/python.svg",
  vscode: "/assets/technology/vscode.svg",
};

const STEP_MS = 1000 / 60;
const MAX_FRAME_MS = 50;
const RESTORE_STIFFNESS = 0.000008;
const RESTORE_DAMPING = 0.00005;
const CENTRAL_ATTRACTION_STRENGTH = 0.000001;
const POINTER_STRENGTH = 0.014;
const POINTER_RADIUS_FACTOR = 1.9;
const MAX_DISPLACEMENT_FACTOR = 0.55;
const MAX_SPEED = 3;
const SETTLE_SPEED = 0.02;
const SETTLE_DISTANCE = 0.18;
// [x, y, relative size] in base-diameter units
const CLUSTER_POINTS = [
  [1.644, -1.706, 0.75], [-2.099, 1.170, 0.95], [2.148, -0.837, 0.70], [-1.319, -0.392, 0.85],
  [-1.315, -1.768, 0.75], [0.318, -0.748, 0.90], [-0.634, -1.114, 1.10], [-1.320, 0.551, 1.00],
  [-0.523, -2.179, 1.00], [0.878, 0.075, 1.05], [0.602, -1.845, 1.30], [1.631, 1.803, 1.05],
  [-2.358, 0.061, 1.25], [0.856, 1.259, 0.80], [1.829, -0.111, 0.85], [1.612, 0.783, 0.95],
  [-0.530, 0.907, 0.70], [0.686, 2.114, 0.90], [-0.055, 1.572, 0.90], [-2.034, -1.119, 1.15],
  [1.282, -0.890, 1.00], [-1.124, 1.673, 1.20], [0.219, 0.750, 0.80], [-0.394, -0.011, 1.10],
] as const;
const CLUSTER_SPAN_X = 5.48;
const CLUSTER_SPAN_Y = 5.24;

interface SphereLayout {
  diameter: number;
  x: number;
  y: number;
}

interface SimulationBody extends SphereLayout {
  body: MatterBody;
  homeX: number;
  homeY: number;
  node: HTMLDivElement;
}

interface PointerState {
  x: number;
  y: number;
  movementX: number;
  movementY: number;
  active: boolean;
  pointerId: number | null;
}

function createLayout(width: number, height: number): SphereLayout[] {
  const diameter = Math.min(
    (width * 0.9) / CLUSTER_SPAN_X,
    (height * 0.92) / CLUSTER_SPAN_Y,
    130,
  );

  return CLUSTER_POINTS.map(([x, y, size]) => ({
    diameter: diameter * size,
    x: width / 2 + x * diameter,
    y: height / 2 + y * diameter,
  }));
}

function TechnologyArtwork({ mark }: { mark: TechnologyMark }) {
  const image = IMAGE_MARKS[mark];
  if (image) {
    return (
      <img
        className={`tech-bubble__mark tech-bubble__mark--${mark}`}
        src={image}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    );
  }

  if (mark === "figma") {
    return (
      <svg className="tech-bubble__mark tech-bubble__mark--figma" viewBox="0 0 100 150" aria-hidden="true">
        <path fill="#f24e1e" d="M25 0h25v50H25a25 25 0 0 1 0-50Z" />
        <path fill="#ff7262" d="M50 0h25a25 25 0 0 1 0 50H50Z" />
        <path fill="#a259ff" d="M25 50h25v50H25a25 25 0 0 1 0-50Z" />
        <circle cx="75" cy="75" r="25" fill="#1abcfe" />
        <path fill="#0acf83" d="M25 100h25v25a25 25 0 1 1-25-25Z" />
      </svg>
    );
  }

  if (mark === "davinciresolve") {
    return (
      <svg className="tech-bubble__mark tech-bubble__mark--davinciresolve" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="6" fill="#111315" />
        <path fill="#f04438" d="M24 3a21 21 0 0 1 18.2 10.5H30.1A12 12 0 0 0 24 11Z" />
        <path fill="#f68b2c" d="M42.2 13.5A21 21 0 0 1 42.2 34H30.1a12 12 0 0 0 0-20.5Z" />
        <path fill="#f5d547" d="M42.2 34A21 21 0 0 1 24 45V33a12 12 0 0 0 6.1-10.5Z" />
        <path fill="#62b957" d="M24 45A21 21 0 0 1 5.8 34H17.9A12 12 0 0 0 24 33Z" />
        <path fill="#35a9dc" d="M5.8 34A21 21 0 0 1 5.8 13.5H17.9a12 12 0 0 0 0 20.5Z" />
        <path fill="#8264b5" d="M5.8 13.5A21 21 0 0 1 24 3v8a12 12 0 0 0-6.1 2.5Z" />
      </svg>
    );
  }

  if (mark === "lenses" || mark === "lighting" || mark === "audio" || mark === "drone") {
    return (
      <svg
        className={`tech-bubble__mark tech-bubble__mark--${mark}`}
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
        aria-hidden="true"
      >
        {mark === "lenses" && (
          <>
            <circle cx="24" cy="24" r="17" stroke="#61dafb" />
            <circle cx="24" cy="24" r="11" stroke="#8b75ff" />
            <circle cx="24" cy="24" r="5" fill="#39c5f3" stroke="#d8f6ff" />
            <path d="m24 7 3 6m14 11-7 2M24 41l-3-7M7 24l7-2" stroke="#b3a5ff" />
          </>
        )}
        {mark === "lighting" && (
          <>
            <path d="M17 21a7 7 0 1 1 14 0c0 3-2 4.5-3.5 6.5-.8 1.1-1 2-1 3.5h-5c0-1.5-.2-2.4-1-3.5C19 25.5 17 24 17 21Z" fill="#f8c64e" stroke="#ffdf84" />
            <path d="M21.5 35h5m-4 4h3M24 5V2m12 7 2-2M12 9l-2-2" stroke="#61dafb" />
          </>
        )}
        {mark === "audio" && (
          <>
            <rect x="18" y="6" width="12" height="23" rx="6" fill="#9b7cff" stroke="#c6b5ff" />
            <path d="M12 22a12 12 0 0 0 24 0M24 34v8m-7 0h14" stroke="#61dafb" />
            <path d="M9 17v8m30-8v8" stroke="#67e8d2" />
          </>
        )}
        {mark === "drone" && (
          <>
            <path d="m19 19-8-8m18 8 8-8M19 29l-8 8m18-8 8 8" stroke="#9bbcff" />
            <circle cx="8" cy="8" r="5" stroke="#42c7f5" />
            <circle cx="40" cy="8" r="5" stroke="#42c7f5" />
            <circle cx="8" cy="40" r="5" stroke="#42c7f5" />
            <circle cx="40" cy="40" r="5" stroke="#42c7f5" />
            <path d="M19 20h10l3 4-3 4H19l-3-4 3-4Z" fill="#ff9b55" stroke="#ffd0a8" />
            <path d="M23 29v4h2v-4" stroke="#ffd0a8" />
          </>
        )}
      </svg>
    );
  }

  const icon = SIMPLE_MARKS[mark];
  if (!icon) return null;

  return (
    <img
      className={`tech-bubble__mark tech-bubble__mark--${mark}`}
      src={`data:image/svg+xml,${encodeURIComponent(icon.svg.replace("<path ", `<path fill="${icon.color}" `))}`}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}

function clearNodeLayout(nodes: (HTMLDivElement | null)[]) {
  for (const node of nodes) {
    if (!node) continue;
    node.style.transform = "";
    node.style.width = "";
    node.style.height = "";
    node.style.removeProperty("--sphere-diameter");
  }
}

export default function TechnologyBallPit() {
  const stageRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let engine: Engine | null = null;
    let bodies: SimulationBody[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let resizeRaf = 0;
    let lastFrame = 0;
    let accumulator = 0;
    let inView = false;
    const pointer: PointerState = {
      x: 0,
      y: 0,
      movementX: 0,
      movementY: 0,
      active: false,
      pointerId: null,
    };

    const render = () => {
      for (const item of bodies) {
        const { x, y } = item.body.position;
        item.node.style.transform = `translate3d(${(x - item.diameter / 2).toFixed(2)}px,${(y - item.diameter / 2).toFixed(2)}px,0)`;
      }
    };

    const isMoving = () =>
      bodies.some((item) => {
        const speed = Math.hypot(item.body.velocity.x, item.body.velocity.y);
        const distance = Math.hypot(
          item.body.position.x - item.homeX,
          item.body.position.y - item.homeY,
        );
        return speed > SETTLE_SPEED || (!pointer.active && distance > SETTLE_DISTANCE);
      });

    const settleNearHomes = () => {
      for (const item of bodies) {
        const distance = Math.hypot(
          item.body.position.x - item.homeX,
          item.body.position.y - item.homeY,
        );
        const speed = Math.hypot(item.body.velocity.x, item.body.velocity.y);
        if (distance > SETTLE_DISTANCE || speed > SETTLE_SPEED) continue;

        Body.setPosition(item.body, { x: item.homeX, y: item.homeY });
        Body.setVelocity(item.body, { x: 0, y: 0 });
        Body.setAngularVelocity(item.body, 0);
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (!engine) return;

      accumulator += Math.min(now - lastFrame, MAX_FRAME_MS);
      lastFrame = now;
      let updated = false;
      while (accumulator >= STEP_MS) {
        updated = true;
        Engine.update(engine, STEP_MS);
        accumulator -= STEP_MS;

        for (const item of bodies) {
          const { body, diameter } = item;
          const speed = Math.hypot(body.velocity.x, body.velocity.y);
          if (speed > MAX_SPEED) {
            Body.setVelocity(body, {
              x: (body.velocity.x / speed) * MAX_SPEED,
              y: (body.velocity.y / speed) * MAX_SPEED,
            });
          }

          const dx = body.position.x - item.homeX;
          const dy = body.position.y - item.homeY;
          const distance = Math.hypot(dx, dy);
          const maximumDistance = diameter * MAX_DISPLACEMENT_FACTOR;
          if (distance <= maximumDistance) continue;

          const normalX = dx / distance;
          const normalY = dy / distance;
          Body.setPosition(body, {
            x: item.homeX + normalX * maximumDistance,
            y: item.homeY + normalY * maximumDistance,
          });
          const outwardSpeed =
            body.velocity.x * normalX + body.velocity.y * normalY;
          if (outwardSpeed > 0) {
            Body.setVelocity(body, {
              x: body.velocity.x - normalX * outwardSpeed,
              y: body.velocity.y - normalY * outwardSpeed,
            });
          }
        }

        if (!pointer.active) settleNearHomes();
      }
      render();
      const hasMotion = pointer.active
        ? !updated ||
          bodies.some(
            (item) =>
              Math.hypot(item.body.velocity.x, item.body.velocity.y) >
              SETTLE_SPEED,
          )
        : isMoving();
      if (inView && !document.hidden && hasMotion) {
        raf = requestAnimationFrame(frame);
      }
    };

    const startFrame = () => {
      if (!engine || !inView || document.hidden || raf) return;
      lastFrame = performance.now();
      accumulator = 0;
      raf = requestAnimationFrame(frame);
    };

    const applyForces = () => {
      if (!bodies.length) return;

      const centerOffset = bodies.reduce(
        (offset, item) => ({
          x: offset.x + item.body.position.x - item.homeX,
          y: offset.y + item.body.position.y - item.homeY,
        }),
        { x: 0, y: 0 },
      );
      centerOffset.x /= bodies.length;
      centerOffset.y /= bodies.length;

      for (const item of bodies) {
        const { body, diameter } = item;
        const mass = body.mass;
        let forceX =
          (-((body.position.x - item.homeX) * RESTORE_STIFFNESS) -
            body.velocity.x * RESTORE_DAMPING) *
            mass -
          centerOffset.x * CENTRAL_ATTRACTION_STRENGTH * mass;
        let forceY =
          (-((body.position.y - item.homeY) * RESTORE_STIFFNESS) -
            body.velocity.y * RESTORE_DAMPING) *
            mass -
          centerOffset.y * CENTRAL_ATTRACTION_STRENGTH * mass;

        if (pointer.active) {
          const dx = body.position.x - pointer.x;
          const dy = body.position.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          const radius = diameter * POINTER_RADIUS_FACTOR;
          if (distance < radius) {
            const falloff = 1 - distance / radius;
            let normalX: number;
            let normalY: number;
            if (distance > 0.5) {
              normalX = dx / distance;
              normalY = dy / distance;
            } else {
              const movement = Math.hypot(pointer.movementX, pointer.movementY);
              normalX = movement ? -pointer.movementX / movement : 0;
              normalY = movement ? -pointer.movementY / movement : -1;
            }

            const push = POINTER_STRENGTH * falloff * falloff * mass;
            forceX += normalX * push;
            forceY += normalY * push;
          }
        }

        Body.applyForce(body, body.position, { x: forceX, y: forceY });
      }
    };

    const build = () => {
      width = stage.clientWidth;
      height = stage.clientHeight;
      if (!width || !height) return;

      if (engine) {
        Events.off(engine, "beforeUpdate", applyForces);
        Composite.clear(engine.world, false);
        Engine.clear(engine);
      }

      engine = Engine.create({
        gravity: { x: 0, y: 0, scale: 0 },
        positionIterations: 8,
        velocityIterations: 6,
        constraintIterations: 3,
      });

      const layouts = createLayout(width, height);
      bodies = layouts.flatMap((layout, index) => {
        const node = nodeRefs.current[index];
        if (!node) return [];

        const radius = layout.diameter / 2;
        const body = Bodies.circle(layout.x, layout.y, radius, {
          density: 0.001,
          friction: 0.08,
          frictionAir: 0.06,
          restitution: 0,
        });
        node.style.width = node.style.height = `${layout.diameter}px`;
        node.style.setProperty("--sphere-diameter", `${layout.diameter}px`);

        return [{
          ...layout,
          body,
          homeX: layout.x,
          homeY: layout.y,
          node,
        }];
      });

      const constraints: Constraint[] = [];
      for (let first = 0; first < bodies.length; first += 1) {
        for (let second = first + 1; second < bodies.length; second += 1) {
          const firstBody = bodies[first];
          const secondBody = bodies[second];
          const length = Math.hypot(
            firstBody.homeX - secondBody.homeX,
            firstBody.homeY - secondBody.homeY,
          );
          if (length > (firstBody.diameter + secondBody.diameter) * 0.625) continue;

          constraints.push(
            Constraint.create({
              bodyA: firstBody.body,
              bodyB: secondBody.body,
              length,
              stiffness: 0.006,
              damping: 0.14,
            }),
          );
        }
      }

      Composite.add(engine.world, [
        ...bodies.map((item) => item.body),
        ...constraints,
      ]);
      Events.on(engine, "beforeUpdate", applyForces);
      render();
      stage.dataset.ready = "true";
    };

    const pointInStage = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const updatePointer = (event: PointerEvent, activePointer = false) => {
      const point = pointInStage(event);
      const wasActive = pointer.active;
      pointer.movementX = point.x - pointer.x;
      pointer.movementY = point.y - pointer.y;
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.active =
        activePointer ||
        (point.x >= 0 &&
          point.x <= width &&
          point.y >= 0 &&
          point.y <= height);
      if (pointer.active || wasActive) startFrame();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" || !event.isPrimary) return;
      pointer.pointerId = event.pointerId;
      updatePointer(event, true);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerId !== pointer.pointerId) {
        return;
      }

      updatePointer(event);
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerId !== pointer.pointerId) return;
      pointer.pointerId = null;
      pointer.active = false;
      startFrame();
    };

    const sync = () => {
      if (!inView || document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        return;
      }
      if (pointer.active || isMoving()) startFrame();
    };

    const resizeObserver = new ResizeObserver(() => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        if (stage.clientWidth === width && stage.clientHeight === height) return;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        build();
        sync();
      });
    });
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        sync();
      },
      { rootMargin: "80px" },
    );

    build();
    stage.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);
    document.addEventListener("visibilitychange", sync);
    resizeObserver.observe(stage);
    intersectionObserver.observe(stage);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      stage.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
      document.removeEventListener("visibilitychange", sync);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      if (engine) {
        Events.off(engine, "beforeUpdate", applyForces);
        Composite.clear(engine.world, false);
        Engine.clear(engine);
      }
      delete stage.dataset.ready;
      clearNodeLayout(nodeRefs.current);
    };
  }, []);

  return (
    <div className="tech-pit">
      <div
        ref={stageRef}
        className="tech-pit__stage"
        role="list"
        aria-label="Technology and equipment"
      >
        {TECHNOLOGY_SPHERES.map((technology, index) => (
          <div
            key={technology.id}
            ref={(element) => {
              nodeRefs.current[index] = element;
            }}
            className="tech-bubble-positioner"
            role="listitem"
            aria-label={technology.name}
          >
            <div className="tech-bubble">
              <span className="tech-bubble__surface">
                <TechnologyArtwork mark={technology.mark} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
