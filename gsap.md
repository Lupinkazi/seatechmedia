# Hairline Riffle

This document describes the current Hairline Riffle implementation used by the
SeaTechMedia “Why Choose” section. The executable code remains in
[`src/components/ui/hairline-riffle.tsx`](./src/components/ui/hairline-riffle.tsx).

## Related files

- [`src/components/ui/hairline-riffle.tsx`](./src/components/ui/hairline-riffle.tsx)
  — React markup, refs, GSAP timeline, ScrollTrigger, keyboard interaction, and
  image preloading.
- [`src/components/WhyChoose.tsx`](./src/components/WhyChoose.tsx)
  — section heading and Riffle mount.
- [`src/data/riffle-cards.ts`](./src/data/riffle-cards.ts)
  — the eight ordered story entries and image URLs.
- [`css/style.css`](./css/style.css)
  — base section, card, surface, image, focus, and fallback styles.
- [`css/responsive.css`](./css/responsive.css)
  — current storytelling layout, desktop dock, mobile stack, and responsive
  overflow rules.
- [`src/main.tsx`](./src/main.tsx)
  — mounts `WhyChoose` into `#why-choose-root`.
- [`index.html`](./index.html)
  — contains the `why-us` section and `why-choose-root` mount point.

## User experience

The section preserves the SeaTechMedia visual identity:

- Light white/off-white background.
- Existing Inter typography.
- SeaTechMedia blue accents.
- Rounded photographic surfaces and restrained shadows.
- Existing “More Than Creative. Built to Make an Impact.” heading.

The presentation has two coordinated areas on desktop:

1. A left story area that is hidden during the centered initial state, then
   reveals with the active advantage label, title, description, and `01 / 08`
   progress line after docking.
2. A right image deck containing eight image-only cards.

The deck follows three phases:

1. **Phase A — dock:** the complete deck moves from its centered position to
   the right-side anchor once.
2. **Phase B — shuffle:** the parent deck remains fixed while the active card
   changes and cards shuffle within the same bounded stage.
3. **Phase C — return:** the complete deck returns to its original centered
   position before the pinned section releases.

The same timeline drives both directions. Upward scrolling reverses the
timeline, including the dock, card order, story content, and return movement.

Cards never use a full-width exit animation. Their internal movement is limited
to the stack offsets, so the deck remains visible and does not create document
overflow.

The initial story is set to `autoAlpha: 0`, translated down by `16px`, and
given `pointer-events: none`. The master timeline reveals it only after Phase A
and hides it at the beginning of Phase C. Reversing the same timeline reverses
both visibility changes.

## Card data

[`src/data/riffle-cards.ts`](./src/data/riffle-cards.ts) exports a readonly
eight-item array:

| Number | Title | Description |
|---|---|---|
| 01 | All-in-One Solutions | Photography, video, events, training, and promotion in one connected partner. |
| 02 | Creative Excellence | Purposeful concepts, thoughtful storytelling, and polished visual craft. |
| 03 | Technical Expertise | Professional camera, lighting, audio, and delivery workflows. |
| 04 | Customer-Focused Approach | Every solution is shaped around your goals, audience, and project requirements. |
| 05 | Professional Standards | Careful planning, clear communication, and attention to detail at every stage. |
| 06 | Integrated Services | Creative production, events, and digital promotion working together as one strategy. |
| 07 | Platform-Ready Content | Content prepared for the formats and audiences you need to reach. |
| 08 | Training & Knowledge Sharing | Practical learning built around real creative production workflows. |

Each item contains:

```ts
interface RiffleCard {
  id: string;
  number: string;
  title: string;
  description: string;
  image: string;
}
```

Folder faces intentionally contain only the image. Titles and descriptions
render once in the left story area, preventing content from bleeding through
inactive image surfaces.

## React and GSAP architecture

The component uses:

```tsx
const stageRef = useRef<HTMLDivElement>(null);
const viewportRef = useRef<HTMLDivElement>(null);
const deckRef = useRef<HTMLDivElement>(null);
const storyRef = useRef<HTMLDivElement>(null);
const cardRefs = useRef<(HTMLElement | null)[]>([]);
const sequenceRef = useRef<gsap.core.Timeline | null>(null);
const activeIndexRef = useRef(0);
const preloadedImagesRef = useRef(new Set<string>());
const [activeIndex, setActiveIndex] = useState<number | null>(null);
```

`deckRef` is important: Phase A and Phase C animate this parent. Individual
cards are not independently translated across the page.

The stack starts from these controlled offsets:

```ts
const stackOffsets = [
  { x: 0, y: 0, rotate: 0 },
  { x: 22, y: -9, rotate: -1.4 },
  { x: -22, y: -18, rotate: 1.2 },
  { x: 42, y: -27, rotate: -1.9 },
  { x: -42, y: -36, rotate: 1.8 },
  { x: 62, y: -45, rotate: -2.3 },
  { x: -62, y: -54, rotate: 2.3 },
  { x: 82, y: -63, rotate: -2.7 },
];
```

Non-desktop layouts scale these offsets to `16%` so the stack remains within
the mobile stage:

```ts
const responsiveOffset = (index: number) => {
  const offset = stackOffsets[index];
  const scale = isDesktop() ? 1 : 0.16;
  return {
    ...offset,
    x: offset.x * scale,
    y: offset.y * scale,
    rotate: offset.rotate * scale,
  };
};
```

## ScrollTrigger configuration

The component registers `ScrollTrigger` inside `useLayoutEffect`, then scopes
all animation work with `gsap.context()`:

```tsx
gsap.registerPlugin(ScrollTrigger);

const scrollPerTransition = reducedMotion ? 0.72 : 0.8;

let timeline: gsap.core.Timeline | null = null;
timeline = gsap.timeline({
  defaults: { ease: "none" },
  onUpdate: () => {
    if (!timeline) return;
    const time = timeline.time();
    let nextIndex = handoffTimes.findIndex((handoff) => time < handoff);
    nextIndex = nextIndex === -1 ? cards.length - 1 : nextIndex;
    if (nextIndex === activeIndexRef.current) return;
    activeIndexRef.current = nextIndex;
    setActiveIndex(nextIndex);
    preloadImage(cards[nextIndex + 1]?.image ?? "");
  },
  scrollTrigger: {
    trigger: isDesktop() && track ? track : stage,
    start: () => `top ${stickyTop()}px`,
    end: () => `+=${scrollDistance()}`,
    scrub: reducedMotion ? true : 0.3,
    invalidateOnRefresh: true,
  },
});
```

The section is pinned at desktop widths (`900px` and above) with CSS
`position: sticky` instead of GSAP's JS pin. A `.folder-riffle-track` wrapper is
sized on every `refreshInit` to `stage height + scrollDistance()`, and the stage
gets `top: stickyTop()` (header height + 18px). Sticky pinning runs on the
compositor, which removes the jitter that the JS `position: fixed` pin showed
at pin entry during real wheel/trackpad scrolling. Below 900px the track height
and inline `top` are cleared, so the normal stacked layout is untouched.
Normal motion uses `0.8` viewport heights per transition (up from `0.72`);
reduced-motion users retain the previous `0.72` distance. The regular scrub
remains `0.3` seconds to favor direct response over additional trailing motion.

## Timeline phases

The timeline uses these durations:

```ts
const phaseA = 0.8;
const transitionDuration = 1;
const phaseB = (cards.length - 1) * transitionDuration;
const phaseC = 0.8;
const phaseBStart = phaseA;
const phaseCStart = phaseBStart + phaseB;
```

### Phase A: move the complete deck and reveal the story

```tsx
const getDockPercent = () => {
  if (!isDesktop() || !storyRef.current || !cardElements[0]) return 0;
  const stageRect = stage.getBoundingClientRect();
  const storyRect = storyRef.current.getBoundingClientRect();
  const initialLeft = (deck.clientWidth - cardElements[0].offsetWidth) / 2;
  const desiredLeft = storyRect.right - stageRect.left + 40;
  return gsap.utils.clamp(
    0,
    35,
    ((desiredLeft - initialLeft) / deck.clientWidth) * 100,
  );
};

gsap.set(storyRef.current, {
  autoAlpha: 0,
  y: 16,
  pointerEvents: "none",
});

timeline.to(deck, {
  xPercent: getDockPercent,
  duration: phaseA,
  ease: "none",
}, 0);

timeline.to(storyRef.current, {
  autoAlpha: 1,
  y: 0,
  pointerEvents: "auto",
  duration: 0.42,
  ease: "none",
}, phaseA);
```

The parent deck moves once. The docking amount is calculated from the actual
stage, story, deck, and card bounds rather than using a fixed desktop-only
percentage. The cards retain their relative arrangement.

### Phase B: contained internal shuffle

For each adjacent pair, the outgoing card moves to the next controlled stack
offset and the incoming card returns to the foreground:

```tsx
timeline.to(outgoing, {
  willChange: "transform, opacity",
  x: outgoingOffset.x,
  y: outgoingOffset.y,
  rotation: outgoingOffset.rotate,
  scale: reducedMotion ? 1 : 0.97,
  opacity: 1,
  duration: reducedMotion ? 0.2 : 0.56,
  ease: "none",
}, transitionStart);

timeline.to(incoming, {
  willChange: "transform, opacity",
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  opacity: 1,
  duration: reducedMotion ? 0.2 : 0.62,
  ease: "none",
}, transitionStart + 0.14);

timeline.set(incoming, {
  zIndex: cards.length + 20,
}, transitionStart + 0.58);

timeline.set(outgoing, {
  zIndex: cards.length - index - 1,
  clearProps: "willChange",
}, transitionStart + 0.72);

timeline.set(incoming, {
  clearProps: "willChange",
}, transitionStart + 0.84);
```

No card is translated to an exit distance and no card is faded out to hide an
offscreen movement.

### Phase C: restore the centered deck

```tsx
timeline.to(deck, {
  xPercent: 0,
  duration: phaseC,
  ease: "none",
}, phaseCStart);

timeline.to(storyRef.current, {
  autoAlpha: 0,
  y: 14,
  pointerEvents: "none",
  duration: 0.32,
  ease: "none",
}, phaseCStart);
```

The story and deck return animations begin together at `phaseCStart`. The
deck's horizontal movement is the inverse of its initial dock.

All primary scroll-controlled transforms use `ease: "none"` so the playhead
tracks scroll position directly. The timeline does not add another active GSAP
tween when React changes the active index; React updates the story content only
at deterministic handoff boundaries.

## Story synchronization

The active story is derived from the same timeline handoff points as the image
deck. `activeIndexRef` avoids repeated React updates while the timeline is
scrubbing. Handoff detection runs on the master timeline's `onUpdate`, so it
tracks the actual playhead while numeric scrub is catching up after scroll
input stops. React renders the current story only when the incoming card
reaches its active handoff.

```tsx
<div className="folder-riffle__story" ref={storyRef} aria-live="polite">
  <p className="folder-riffle__eyebrow">
    {activeIndex === null
      ? "Selected advantage"
      : `Advantage ${cards[activeIndex].number}`}
  </p>
  <div className="folder-riffle__story-window">
    <h3>{activeIndex === null ? cards[0].title : cards[activeIndex].title}</h3>
    <p>{activeIndex === null ? cards[0].description : cards[activeIndex].description}</p>
  </div>
  <div
    className="folder-riffle__progress"
    aria-label={`Showing ${(activeIndex ?? 0) + 1} of ${cards.length}`}
  >
    <span>{String((activeIndex ?? 0) + 1).padStart(2, "0")}</span>
    <span aria-hidden="true">/</span>
    <span className="folder-riffle__progress-line">
      <span style={{ width: `${(((activeIndex ?? 0) + 1) / cards.length) * 100}%` }} />
    </span>
    <span>{String(cards.length).padStart(2, "0")}</span>
  </div>
</div>
```

The story and story window have stable minimum heights in CSS, preventing
title length changes from shifting the composition. The active story content
updates at the same discrete handoff boundaries as the card deck; it does not
run a separate content animation.

## Keyboard and direct navigation

Cards remain focusable and clickable. `Enter` and `Space` navigate to the
focused card. Arrow keys move focus and scrub to the adjacent story item:

```tsx
const progress =
  (0.8 + nextIndex) / (0.8 + (cards.length - 1) + 0.8);

const root = document.documentElement;
const previousScrollBehavior = root.style.scrollBehavior;
root.style.scrollBehavior = "auto";
try {
  trigger.scroll(trigger.start + progress * (trigger.end - trigger.start));
  trigger.update();
} finally {
  root.style.scrollBehavior = previousScrollBehavior;
}
```

Direct navigation temporarily disables the site's global smooth-scroll CSS
for this seek, then restores it. This prevents a second, competing scroll
animation from delaying the selected card; normal wheel and trackpad scrolling
remain native and scroll-controlled.

## Image loading and cleanup

The first three images are preloaded immediately. Each next image is preloaded
when its story handoff becomes active. Images use `decoding="async"` and the
first image uses eager loading. The preload helper ignores empty image values
and does not refresh ScrollTrigger after each image decode.

The effect cleanup clears the timeline reference and calls
`context.revert()`, restoring DOM styles and removing the ScrollTrigger created
by the component.

## Markup and mount

[`src/components/WhyChoose.tsx`](./src/components/WhyChoose.tsx) supplies the
section heading and data:

```tsx
export default function WhyChoose() {
  return (
    <div className="why-feature">
      <div className="why-feature__intro">
        <p className="section-tag">WHY CHOOSE SEATECHMEDIA</p>
        <h2>
          More Than <span className="why-feature__accent">Creative.</span>
          <br />
          Built to Make an Impact.
        </h2>
      </div>
      <Riffle cards={RIFFLE_CARDS} />
    </div>
  );
}
```

[`src/main.tsx`](./src/main.tsx) mounts the component:

```tsx
const whyChooseMount = document.getElementById("why-choose-root");
if (!whyChooseMount) {
  throw new Error("The Why Choose mount point is missing from index.html.");
}
createRoot(whyChooseMount).render(<WhyChoose />);
```

The HTML mount is inside:

```html
<section class="section why-us">
  <div class="container">
    <div id="why-choose-root"></div>
  </div>
</section>
```

## CSS responsibilities

The existing base styles in [`css/style.css`](./css/style.css) establish the
SeaTechMedia section and card surface. The current responsive overrides in
[`css/responsive.css`](./css/responsive.css) provide the active riffle layout.

### Desktop composition

```css
.folder-riffle__story {
  position: absolute;
  top: 50%;
  left: 0;
  width: min(34%, 390px);
  transform: translateY(-50%);
  z-index: 4;
}

.folder-riffle__viewport {
  inset: 0;
  overflow: visible;
}

.folder-riffle__deck {
  position: absolute;
  inset: 0;
  will-change: transform;
}

.folder-card {
  top: 50%;
  left: 50%;
  width: min(560px, 92%);
  height: clamp(340px, calc(100svh - 300px), 460px);
  transform: translate(-50%, -50%);
}
```

The story and deck share the full section background rather than separate
bordered panels.

### Image-only card faces

```css
.folder-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 1;
  filter: saturate(1.08) contrast(1.03) brightness(1.02);
}

.folder-card__surface {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.folder-card__surface::before,
.folder-card__surface::after {
  display: none;
}
```

The old card copy, metadata, icons, lines, and STM mark are not rendered by the
current component.

### Responsive layout

At widths below `900px`, the story becomes a normal-flow block above the deck,
the deck does not dock horizontally, and stack offsets are reduced to `16%` in
JavaScript:

```css
@media (max-width: 899px) {
  .folder-riffle__story {
    position: relative;
    width: 100%;
    min-height: 230px;
    transform: none;
  }

  .folder-riffle__viewport {
    inset: 220px 0 0;
  }
}
```

At widths below `560px`, the image card is reduced to a `270px` height. The
stack offsets are also reduced in JavaScript. The final image-only surface
override disables the unused legacy backdrop blur at every viewport width.

The section intentionally keeps `.folder-riffle` overflow visible for pinning,
while the deck and card dimensions remain bounded by the section layout.

## Reduced motion

`prefers-reduced-motion: reduce` changes the timeline to true scrub behavior,
shortens card transforms, removes scale emphasis, and disables the progress
line CSS transition. The experience remains usable without relying on motion.

## Rendering performance

The deck parent is the only permanently composited moving surface:

```css
.folder-riffle__deck {
  will-change: transform;
  transform: translate3d(0, 0, 0);
}
```

Card transforms and opacity are animated instead of width, height, top, left,
margin, or padding. `will-change` is applied to individual cards only during
their active handoff and is cleared by the master timeline afterward.

The current image-only surfaces disable the legacy `backdrop-filter` and
`-webkit-backdrop-filter` declarations. This removes a large-area blur pass
from every moving card while preserving the photographic surface, border,
radius, and shadow treatment.

No global `gsap.ticker.fps()` setting and no additional animation-frame loop
are used. ScrollTrigger remains the sole continuous scheduler.

## Validation

The implementation was validated with:

```text
npm run build
```

The production build passes TypeScript checking and Vite bundling. A local
headless Chromium check using incremental native wheel input compared scrub
values `0.3`, `0.4`, `0.5`, and `0.6`, and scroll distances `0.72`, `0.8`, and
`0.9` viewport heights per transition. Each run rendered all eight cards,
showed `04 / 08` at the midpoint and `08 / 08` at the forward end, then
reversed. The `0.72` and `0.8` distances returned to `07 / 08` in the reverse
check; `0.9` was still at `06 / 08` after the same 900ms settling window. The
`0.8` distance was selected as the smallest tested increase and adds about 11%
more scroll resolution per transition. All four scrub values kept the story
correct at the midpoint, forward end, and reverse check. The `0.3` scrub was
retained for responsiveness because higher values showed no benefit in these
automated checks. Synthetic wheel runs do not establish physical-device frame
rates or trackpad feel. Desktop, tablet, and mobile browser checks also
confirmed keyboard forward/reverse navigation, direct card selection,
reduced-motion navigation, no horizontal overflow, desktop pinning only, zero
card CSS transition duration, the hidden initial story state, and no card
surface backdrop blur.

Automated browser frame probes in headless Chromium can be throttled by the
environment and are not used as a universal 60 FPS guarantee. The production
build and rendered behavior are the acceptance gates; real-device profiling
should be used for final hardware-specific frame-budget decisions.
