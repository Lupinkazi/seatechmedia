import { ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const faqItems: FaqItem[] = [
  {
    id: "services",
    question: "What services does SeaTechMedia provide?",
    answer:
      "SeaTechMedia provides media production, digital marketing, online media publishing, event management, equipment sales and rental, and website and IT solutions.",
  },
  {
    id: "events",
    question: "Does SeaTechMedia provide photography and videography for events?",
    answer:
      "Yes. We support event photography, event videography, and live event coverage for corporate, promotional, and community events.",
  },
  {
    id: "post-production",
    question: "Do you provide video editing and post-production services?",
    answer:
      "Yes. Our post-production team can help with editing, color grading, visual effects, animation, and delivery-ready content.",
  },
  {
    id: "social-media",
    question: "Can businesses hire you for social media management?",
    answer:
      "Yes. We provide social media marketing, content planning, promotional campaign support, and digital platform communication.",
  },
  {
    id: "websites",
    question: "Do you provide website development and hosting?",
    answer:
      "Yes. Website development, domain registration, hosting guidance, and broader IT consulting services are available.",
  },
  {
    id: "equipment",
    question: "Can customers rent cameras and production equipment?",
    answer:
      "Yes. Equipment rental is available for cameras, lenses, lighting, and related production gear.",
  },
  {
    id: "training",
    question: "Do you provide photography and video editing training?",
    answer:
      "Yes. SeaTechMedia offers training in photography, videography, editing, cinematography, and multimedia production.",
  },
  {
    id: "quotation",
    question: "How can I request a quotation?",
    answer:
      "Send an inquiry through the contact form or reach out by email or WhatsApp using the details in the contact section.",
  },
  {
    id: "combined-services",
    question: "Can I combine multiple services in one project?",
    answer:
      "Yes. We support integrated projects that combine media production, marketing, events, branding, and technology services.",
  },
];

export default function FAQs() {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="faq-feature" aria-labelledby="faq-heading">
      <div className="faq-feature__intro">
        <h2 id="faq-heading">FAQs</h2>
        <p className="faq-feature__description">
          Everything you need to know about SeaTechMedia.
        </p>
        <p className="faq-feature__support">
          Can’t find what you’re looking for? Reach out to our{" "}
          <a href="mailto:seatechp@gmail.com">SeaTechMedia team</a> for
          assistance.
        </p>
      </div>

      <div className="faq-feature__list">
        {faqItems.map((item) => {
          const isOpen = openItem === item.id;
          const answerId = `faq-answer-${item.id}`;
          const questionId = `faq-question-${item.id}`;

          return (
            <div
              className={`faq-feature__item${isOpen ? " is-open" : ""}`}
              key={item.id}
            >
              <button
                type="button"
                className="faq-feature__trigger"
                id={questionId}
                aria-expanded={isOpen}
                aria-controls={answerId}
                onClick={() => setOpenItem(isOpen ? null : item.id)}
              >
                <span>{item.question}</span>
                <ChevronDown className="faq-feature__icon" aria-hidden="true" />
              </button>

              <motion.div
                id={answerId}
                className="faq-feature__answer"
                role="region"
                aria-labelledby={questionId}
                aria-hidden={!isOpen}
                initial={false}
                animate={isOpen ? "open" : "closed"}
                variants={{
                  closed: { height: 0, opacity: 0 },
                  open: { height: "auto", opacity: 1 },
                }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.28,
                  ease: "easeOut",
                }}
              >
                <BlurredStagger text={item.answer} isOpen={isOpen} />
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BlurredStagger({ text, isOpen }: { text: string; isOpen: boolean }) {
  return (
    <motion.p
      className="faq-feature__answer-copy"
      initial="hidden"
      animate={isOpen ? "show" : "hidden"}
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.022, delayChildren: 0.12 },
        },
      }}
    >
      <span className="faq-feature__answer-visual" aria-hidden="true">
        {Array.from(text).map((character, index) => (
          <motion.span
            key={index}
            className="faq-feature__answer-character"
            variants={{
              hidden: { opacity: 0, filter: "blur(8px)" },
              show: { opacity: 1, filter: "blur(0px)" },
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {character === " " ? "\u00a0" : character}
          </motion.span>
        ))}
      </span>
      <span className="faq-feature__answer-accessible">{text}</span>
    </motion.p>
  );
}
