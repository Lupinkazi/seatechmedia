import {
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

interface WordRevealContextValue {
  scrollYProgress: MotionValue<number>;
  totalWords: number;
}

const WordRevealContext = createContext<WordRevealContextValue | null>(null);

const REST_OPACITY = 0.2;
const REVEAL_SPAN = 0.8;
const WORD_WINDOW = 0.2;

function getWordRange(index: number, totalWords: number): [number, number] {
  const start = totalWords <= 1 ? 0 : (index / (totalWords - 1)) * REVEAL_SPAN;
  return [start, Math.min(1, start + WORD_WINDOW)];
}

function getWordOpacity(
  scrollYProgress: MotionValue<number>,
  range: [number, number],
) {
  return useTransform(scrollYProgress, range, [REST_OPACITY, 1]);
}

function WordRevealText({
  text,
  startIndex,
}: {
  text: string;
  startIndex: number;
}) {
  const context = useContext(WordRevealContext);
  if (!context) {
    throw new Error("WordRevealText must be rendered inside MotionScrollWordReveal.");
  }

  const words = text.trim().split(/\s+/);

  return (
    <>
      {words.map((word, wordIndex) => {
        const opacity = getWordOpacity(
          context.scrollYProgress,
          getWordRange(startIndex + wordIndex, context.totalWords),
        );
        return (
          <motion.span
            key={`${startIndex}-${wordIndex}-${word}`}
            style={{ opacity }}
          >
            {word}
            {wordIndex < words.length - 1 ? " " : ""}
          </motion.span>
        );
      })}
    </>
  );
}

export interface MotionScrollWordRevealProps {
  totalWords: number;
  className?: string;
  children: (renderText: (text: string) => ReactNode) => ReactNode;
}

export default function MotionScrollWordReveal({
  totalWords,
  className,
  children,
}: MotionScrollWordRevealProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const scrollYProgress = useMotionValue(0);

  // Measure live every frame (plus scroll events from any container) so progress
  // stays correct whatever element or library is actually driving the scroll.
  useEffect(() => {
    let frame = 0;
    // The reveal only plays on a fresh load, while scrolling down from above the
    // section. Loading at/past the section, or scrolling back to it later, shows all text.
    let armed: boolean | null = null;
    let furthest = 0;
    const update = () => {
      const node = targetRef.current;
      if (!node) return;
      const { top, height } = node.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = (vh * 0.85 - top) / (vh * 0.3 + height);
      const raw = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
      if (armed === null) armed = raw <= 0;
      furthest = Math.max(furthest, raw);
      const next = armed ? furthest : 1;
      if (next !== scrollYProgress.get()) scrollYProgress.set(next);
    };
    const tick = () => {
      update();
      frame = window.requestAnimationFrame(tick);
    };

    tick();
    window.addEventListener("scroll", update, { passive: true, capture: true });
    window.addEventListener("resize", update);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update, { capture: true });
      window.removeEventListener("resize", update);
    };
  }, [scrollYProgress]);
  let nextWordIndex = 0;

  const renderText = (text: string) => {
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const startIndex = nextWordIndex;
    nextWordIndex += wordCount;

    return <WordRevealText key={`${startIndex}-${text}`} text={text} startIndex={startIndex} />;
  };

  return (
    <WordRevealContext.Provider
      value={{ scrollYProgress, totalWords }}
    >
      <div ref={targetRef} className={className}>
        {children(renderText)}
      </div>
    </WordRevealContext.Provider>
  );
}
