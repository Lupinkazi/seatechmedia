import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface ProcessStage {
  number: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}

const stages: readonly ProcessStage[] = [
  {
    number: "01",
    title: "Discover",
    description:
      "Understand client requirements, objectives, audience, and project expectations.",
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Creative team discussing a project around a table",
  },
  {
    number: "02",
    title: "Plan",
    description:
      "Develop a strategy, creative direction, and project execution plan.",
    image:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Team planning a project together in a bright studio",
  },
  {
    number: "03",
    title: "Create",
    description:
      "Execute the project using appropriate creative, production, and technical resources.",
    image:
      "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Professional camera setup during a video production",
  },
  {
    number: "04",
    title: "Deliver",
    description:
      "Review, finalize, and deliver the completed project with clarity and care.",
    image:
      "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Creative professional editing a finished video",
  },
];

export default function ScrollRevealContentA() {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const progress = progressRef.current;
    if (!section || !progress) return;

    let frame = 0;
    let lastIndex = -1;

    const updateProgress = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const amount = Math.min(1, Math.max(0, -rect.top / travel));
      const nextIndex = Math.min(
        stages.length - 1,
        Math.floor(amount * stages.length),
      );
      progress.style.setProperty("--process-progress", `${amount * 100}%`);

      if (nextIndex !== lastIndex) {
        lastIndex = nextIndex;
        setActiveIndex(nextIndex);
      }
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <section
      ref={sectionRef}
      className="process-story"
      aria-labelledby="process-story-title"
    >
      <div className="container process-story__sticky">
        <div className="section-heading process-story__heading">
          <p className="section-tag">OUR PROCESS</p>
          <h2 id="process-story-title">Ideas Into Impact.</h2>
        </div>

        <div className="process-story__layout">
          <div className="process-story__steps">
            <div className="process-story__rail" ref={progressRef} aria-hidden="true">
              <span className="process-story__rail-fill" />
            </div>

            <ol className="process-story__list">
              {stages.map((stage, index) => {
                const isActive = index === activeIndex;
                const isComplete = index < activeIndex;

                return (
                  <li
                    className={`process-story__step${isActive ? " is-active" : ""}${isComplete ? " is-complete" : ""}`}
                    key={stage.number}
                  >
                    <span className="process-story__step-marker">
                      {stage.number}
                    </span>
                    <motion.div
                      className="process-story__step-copy"
                      animate={{
                        opacity: isActive ? 1 : isComplete ? 0.66 : 0.42,
                        y: isActive ? 0 : 6,
                      }}
                      transition={transition}
                    >
                      <h3>{stage.title}</h3>
                      <p>{stage.description}</p>
                    </motion.div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="process-story__visual" aria-live="polite">
            <AnimatePresence mode="sync">
              <motion.img
                key={stages[activeIndex].image}
                src={stages[activeIndex].image}
                alt={stages[activeIndex].imageAlt}
                className="process-story__image"
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0 }}
                transition={transition}
                loading={activeIndex === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            </AnimatePresence>
            <div className="process-story__visual-caption">
              <span>Stage {stages[activeIndex].number}</span>
              <strong>{stages[activeIndex].title}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
