import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export interface RiffleCard {
  id: string;
  number: string;
  title: string;
  description: string;
  image: string;
}

interface RiffleProps {
  cards: readonly RiffleCard[];
}

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

export default function Riffle({ cards }: RiffleProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const sequenceRef = useRef<gsap.core.Timeline | null>(null);
  const activeIndexRef = useRef(0);
  const preloadedImagesRef = useRef(new Set<string>());
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 899px)").matches,
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 899px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const stage = stageRef.current;
    const viewport = viewportRef.current;
    const deck = deckRef.current;
    if (!stage || !viewport || !deck || cards.length < 2) return;
    const cardElements = cardRefs.current.filter(
      (card): card is HTMLElement => card !== null,
    );
    if (cardElements.length !== cards.length) return;

    let syncTrackCleanup: () => void = () => undefined;
    const context = gsap.context(() => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isDesktop = () => !isMobile;
      const responsiveOffset = (index: number) => {
        const offset = stackOffsets[index];
        const scale = isDesktop() ? 1 : 0.16;
        return { ...offset, x: offset.x * scale, y: offset.y * scale, rotate: offset.rotate * scale };
      };
      const headerHeight = () =>
        document.querySelector(".site-header")?.getBoundingClientRect().height ?? 0;
      const preloadImage = (image: string) => {
        if (!image) return;
        if (preloadedImagesRef.current.has(image)) return;
        preloadedImagesRef.current.add(image);
        const preload = new Image();
        preload.decoding = "async";
        preload.src = image;
        if ("decode" in preload) void preload.decode().catch(() => undefined);
      };

      preloadImage(cards[0].image);
      preloadImage(cards[1].image);
      preloadImage(cards[2]?.image ?? "");

      stackOffsets.forEach((offset, index) => {
        const card = cardElements[index];
        const position = responsiveOffset(index);
        gsap.set(card, {
          xPercent: -50,
          ...(isMobile ? { yPercent: -50 } : {}),
          x: position.x,
          y: position.y,
          rotation: position.rotate,
          scale: 1,
          opacity: 1,
          zIndex: cards.length - index,
          clearProps: "willChange",
        });
      });

      let timeline: gsap.core.Timeline | null = null;
      const phaseA = 0.8;
      const transitionDuration = 1;
      const phaseB = (cards.length - 1) * transitionDuration;
      const phaseC = 0.8;
      const scrollPerTransition = reducedMotion
        ? isDesktop()
          ? 0.72
          : 0.24
        : isDesktop()
          ? 0.8
          : 0.32;
      const handoffTimes = cards.slice(1).map((_, index) =>
        phaseA + index * transitionDuration + (isMobile ? 0.58 : 0.72),
      );
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
      if (!isMobile && storyRef.current) {
        gsap.set(storyRef.current, {
          autoAlpha: 0,
          y: 16,
          pointerEvents: "none",
        });
      }
      const track = trackRef.current;
      const scrollDistance = () => {
        const perTransition = (cards.length - 1) * window.innerHeight * scrollPerTransition;
        return isDesktop()
          ? Math.max(window.innerHeight * (reducedMotion ? 0.8 : 4.8), perTransition)
          : Math.max(window.innerHeight * 0.65, perTransition);
      };
      const stickyTop = () => Math.ceil(headerHeight() + 18);
      // Native CSS sticky pinning runs on the compositor, so the stage cannot lag the scroll position like a JS-fixed pin does.
      const syncTrack = () => {
        if (!track) return;
        stage.style.top = `${stickyTop()}px`;
        track.style.height = `${stage.offsetHeight + scrollDistance()}px`;
      };
      syncTrack();
      ScrollTrigger.addEventListener("refreshInit", syncTrack);
      syncTrackCleanup = syncTrack;

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

      const phaseBStart = phaseA;
      const phaseCStart = phaseBStart + phaseB;

      timeline.to(deck, {
        xPercent: getDockPercent,
        duration: phaseA,
        ease: "none",
      }, 0);
      if (!isMobile && storyRef.current) {
        timeline.to(storyRef.current, {
          autoAlpha: 1,
          y: 0,
          pointerEvents: "auto",
          duration: 0.42,
          ease: "none",
        }, phaseA);
      }

      cards.slice(0, -1).forEach((_, index) => {
        const outgoing = cardElements[index];
        const incoming = cardElements[index + 1];
        if (!outgoing || !incoming) return;

        const transitionStart = phaseBStart + index * transitionDuration;
        const outgoingOffset = responsiveOffset((index + 1) % stackOffsets.length);

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
        timeline.set(incoming, { zIndex: cards.length + 20 }, transitionStart + 0.58);
        timeline.set(outgoing, { zIndex: cards.length - index - 1, clearProps: "willChange" }, transitionStart + 0.72);
        timeline.set(incoming, { clearProps: "willChange" }, transitionStart + 0.84);
      });

      timeline.to(deck, {
        xPercent: 0,
        duration: phaseC,
        ease: "none",
      }, phaseCStart);
      if (!isMobile && storyRef.current) {
        timeline.to(storyRef.current, {
          autoAlpha: 0,
          y: 14,
          pointerEvents: "none",
          duration: 0.32,
          ease: "none",
        }, phaseCStart);
      }

      sequenceRef.current = timeline;
      activeIndexRef.current = 0;
      setActiveIndex(0);
      window.requestAnimationFrame(() => ScrollTrigger.refresh());
    }, stage);

    return () => {
      sequenceRef.current = null;
      ScrollTrigger.removeEventListener("refreshInit", syncTrackCleanup);
      if (trackRef.current) trackRef.current.style.height = "";
      stage.style.top = "";
      context.revert();
    };
  }, [cards, isMobile]);

  const animateTo = (nextIndex: number) => {
    const timeline = sequenceRef.current;
    if (!timeline) return;
    const trigger = timeline.scrollTrigger;
    if (!trigger) return;
    const targetTime = isMobile && nextIndex > 0
      ? 0.8 + nextIndex - 1 + 0.59
      : 0.8 + (isMobile ? 0 : nextIndex);
    const progress = targetTime / (0.8 + (cards.length - 1) + 0.8);
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    try {
      trigger.scroll(trigger.start + progress * (trigger.end - trigger.start));
      trigger.update();
    } finally {
      root.style.scrollBehavior = previousScrollBehavior;
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>, index: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      animateTo(index);
      return;
    }
    if (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
      const next = (index + direction + cards.length) % cards.length;
      cardRefs.current[next]?.focus();
      animateTo(next);
    }
  };

  return (
    <div className="folder-riffle-track" ref={trackRef}>
    <div
      className="folder-riffle"
      ref={stageRef}
      aria-label="SeaTechMedia principles"
    >
      <div className="folder-riffle__glow" aria-hidden="true" />
      <div className="folder-riffle__story" ref={storyRef} aria-live="polite">
        <p className="folder-riffle__eyebrow">{activeIndex === null ? "Selected advantage" : `Advantage ${cards[activeIndex].number}`}</p>
        <div className="folder-riffle__story-window">
          <h3>{activeIndex === null ? cards[0].title : cards[activeIndex].title}</h3>
          <p>{activeIndex === null ? cards[0].description : cards[activeIndex].description}</p>
        </div>
        <div className="folder-riffle__progress" aria-label={`Showing ${(activeIndex ?? 0) + 1} of ${cards.length}`}>
          <span>{String((activeIndex ?? 0) + 1).padStart(2, "0")}</span>
          <span aria-hidden="true">/</span>
          <span className="folder-riffle__progress-line"><span style={{ width: `${(((activeIndex ?? 0) + 1) / cards.length) * 100}%` }} /></span>
          <span>{String(cards.length).padStart(2, "0")}</span>
        </div>
      </div>
      <div className="folder-riffle__viewport" ref={viewportRef}>
        <div className="folder-riffle__deck" ref={deckRef}>
        {cards.map((card, index) => {
        const isActive = activeIndex === index;
        return (
          <article
            className={`folder-card${isActive ? " is-active" : ""}`}
            key={card.id}
            ref={(element) => { cardRefs.current[index] = element; }}
            style={{ "--folder-index": index } as CSSProperties}
            tabIndex={0}
            onClick={() => animateTo(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            aria-label={card.title}
          >
            <div className="folder-card__surface">
              <img className="folder-card__image" src={card.image} alt="" loading={index === 0 ? "eager" : "lazy"} decoding="async" />
            </div>
          </article>
        );
        })}
        </div>
      </div>
    </div>
    </div>
  );
}
