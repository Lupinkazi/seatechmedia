import { ArrowRight } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { useState, type CSSProperties, type PointerEvent } from "react";

export interface ServiceCardProps {
  title: string;
  description: string;
  href: string;
  variant: "royal" | "ice" | "navy" | "cyan" | "sky";
  imgAlt: string;
  index: number;
}

export default function ServiceCard({
  title,
  description,
  href,
  variant,
  imgAlt,
  index,
}: ServiceCardProps) {
  const [spotlight, setSpotlight] = useState({ x: "50%", y: "50%" });
  const hoverDuration = 0.65;
  const hoverEase = "easeInOut";

  const cardVariants: Variants = {
    rest: {
      y: 0,
      scale: 1,
      zIndex: 0,
      boxShadow: "0 18px 34px rgba(20, 46, 80, 0.1)",
      transition: {
        duration: hoverDuration,
        ease: hoverEase,
      },
    },
    hover: {
      y: -6,
      scale: 1.02,
      zIndex: 2,
      boxShadow: "0 26px 48px rgba(20, 46, 80, 0.17)",
      transition: {
        duration: hoverDuration,
        ease: hoverEase,
      },
    },
  };

  const titleVariants: Variants = {
    rest: {
      scale: 1,
      transition: { duration: hoverDuration, ease: hoverEase },
    },
    hover: {
      scale: 1.04,
      transition: { duration: hoverDuration, ease: hoverEase },
    },
  };

  const ctaVariants: Variants = {
    rest: {
      scale: 1,
      transition: { duration: hoverDuration, ease: hoverEase },
    },
    hover: {
      scale: 1.05,
      transition: { duration: hoverDuration, ease: hoverEase },
    },
  };

  const arrowVariants: Variants = {
    rest: {
      x: 0,
      transition: { duration: hoverDuration, ease: hoverEase },
    },
    hover: {
      x: 5,
      transition: { duration: hoverDuration, ease: hoverEase },
    },
  };

  const illustrationVariants: Variants = {
    rest: {
      scale: 1,
      rotate: 0,
      x: 0,
      y: 0,
      transition: {
        duration: hoverDuration,
        ease: hoverEase,
      },
    },
    hover: {
      scale: 1.1,
      rotate: 3,
      x: 9,
      y: -2,
      transition: {
        duration: hoverDuration,
        ease: hoverEase,
      },
    },
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    setSpotlight({ x: `${x}px`, y: `${y}px` });
  };

  const handlePointerLeave = () => {
    setSpotlight({ x: "50%", y: "50%" });
  };

  const cardStyle = {
    "--spotlight-x": spotlight.x,
    "--spotlight-y": spotlight.y,
  } as CSSProperties;

  return (
    <motion.article
      className={`service-card service-card--${variant}`}
      style={cardStyle}
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.h3 variants={titleVariants}>{title}</motion.h3>
      <motion.div
        className="service-illustration"
        aria-label={imgAlt}
        role="img"
        variants={illustrationVariants}
      >
        <ServiceIllustration variant={variant} />
      </motion.div>
      <p className="sr-only">{description}</p>
      <motion.a
        className="service-link"
        href={href}
        aria-label={`Learn more about ${title}`}
        variants={ctaVariants}
      >
        <span className="service-link-label">Learn More</span>
        <motion.span className="service-link-arrow" variants={arrowVariants}>
          <ArrowRight aria-hidden="true" size={19} strokeWidth={2.2} />
        </motion.span>
      </motion.a>
    </motion.article>
  );
}

function ServiceIllustration({ variant }: Pick<ServiceCardProps, "variant">) {
  const accent = variant === "navy" ? "#42D5EA" : "#2165E8";
  const dark = variant === "royal" || variant === "navy" ? "#071A36" : "#142E50";

  if (variant === "royal") {
    return (
      <svg viewBox="0 0 300 220" aria-hidden="true">
        <defs>
          <linearGradient id="camera-body" x1="0" x2="1">
            <stop stopColor="#0A2B62" />
            <stop offset="1" stopColor="#42D5EA" />
          </linearGradient>
        </defs>
        <ellipse cx="187" cy="199" rx="98" ry="13" fill="#0B4DAE" opacity=".28" />
        <path d="M92 70h139c12 0 21 9 21 21v75c0 12-9 21-21 21H92c-13 0-23-9-23-21V91c0-12 10-21 23-21Z" fill="url(#camera-body)" />
        <path d="m108 70 17-28h68l16 28Z" fill="#0C326D" />
        <circle cx="185" cy="128" r="48" fill="#071A36" />
        <circle cx="185" cy="128" r="34" fill="#2165E8" />
        <circle cx="185" cy="128" r="22" fill="#071A36" />
        <circle cx="173" cy="116" r="7" fill="#B7FAFF" opacity=".8" />
        <rect x="88" y="92" width="30" height="17" rx="6" fill="#72E7F5" />
      </svg>
    );
  }

  if (variant === "ice") {
    return (
      <svg viewBox="0 0 300 220" aria-hidden="true">
        <defs>
          <linearGradient id="megaphone" x1="0" x2="1">
            <stop stopColor="#2165E8" />
            <stop offset="1" stopColor="#42D5EA" />
          </linearGradient>
        </defs>
        <ellipse cx="189" cy="197" rx="90" ry="12" fill="#8CCBE3" opacity=".38" />
        <path d="m92 88 122-43c17-6 34 6 34 24v35c0 18-17 30-34 24L92 87Z" fill="url(#megaphone)" />
        <path d="m92 88-26 20c-10 8-7 24 6 28l30 8 21-43Z" fill="#142E50" />
        <path d="m126 99 32 12-13 62c-3 13-21 15-27 3l-17-35Z" fill="#2165E8" />
        <path d="M237 58c20 7 28 18 31 33M244 43c29 5 43 18 49 37" fill="none" stroke="#2165E8" strokeWidth="8" strokeLinecap="round" />
        <circle cx="91" cy="123" r="8" fill="#B7FAFF" />
      </svg>
    );
  }

  if (variant === "navy") {
    return (
      <svg viewBox="0 0 300 220" aria-hidden="true">
        <ellipse cx="193" cy="199" rx="92" ry="12" fill="#020C1B" opacity=".5" />
        <path d="M72 54h155c8 0 14 6 14 14v104c0 8-6 14-14 14H72c-8 0-14-6-14-14V68c0-8 6-14 14-14Z" fill="#071A36" stroke="#42D5EA" strokeWidth="5" />
        <path d="M73 67h153v72H73Z" fill="#E8F6FC" />
        <path d="M88 89h73M88 103h108M88 117h61" stroke="#2165E8" strokeWidth="6" strokeLinecap="round" />
        <path d="M226 81 265 96v88c0 7-5 12-12 12h-27Z" fill="#0B4DAE" />
        <circle cx="215" cy="166" r="5" fill="#42D5EA" />
      </svg>
    );
  }

  if (variant === "cyan") {
    return (
      <svg viewBox="0 0 300 220" aria-hidden="true">
        <defs>
          <linearGradient id="mic-body" x1="0" x2="1">
            <stop stopColor="#071A36" />
            <stop offset="1" stopColor="#2165E8" />
          </linearGradient>
        </defs>
        <ellipse cx="186" cy="199" rx="72" ry="12" fill="#087D91" opacity=".38" />
        <rect x="160" y="47" width="56" height="108" rx="28" fill="url(#mic-body)" />
        <path d="M144 102v17c0 32 20 52 44 52s44-20 44-52v-17" fill="none" stroke="#E8F6FC" strokeWidth="9" strokeLinecap="round" />
        <path d="M188 171v27M157 198h62" stroke="#071A36" strokeWidth="9" strokeLinecap="round" />
        <path d="M174 67h28M174 82h28M174 97h28" stroke="#42D5EA" strokeWidth="6" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 300 220" aria-hidden="true">
      <ellipse cx="186" cy="199" rx="104" ry="12" fill="#8AB8E6" opacity=".35" />
      <path d="M63 63 195 42c8-1 15 5 15 13v92c0 8-6 14-14 15L64 181c-8 1-15-5-15-13V78c0-8 6-14 14-15Z" fill="#142E50" />
      <path d="m72 76 119-18v77L72 151Z" fill="#E8F6FC" />
      <path d="m73 164 120-17 36 20-132 21Z" fill="#2165E8" />
      <path d="M99 100h60M99 113h44" stroke={accent} strokeWidth="7" strokeLinecap="round" />
      <circle cx="178" cy="93" r="11" fill="#42D5EA" />
      <path d="m215 80 36-8v73l-36 7Z" fill={dark} opacity=".9" />
    </svg>
  );
}
