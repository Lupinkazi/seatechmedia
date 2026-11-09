import { useEffect, useState } from "react";
import {
  LiquidNavbar,
  NimbusIcons,
  type LiquidNavItem,
} from "../components/ui/liquid-glass-navbar";

const navigationItems: LiquidNavItem[] = [
  { label: "Home", href: "#home", icon: NimbusIcons.home, fx: "glow" },
  { label: "About", href: "#about", icon: NimbusIcons.globe, fx: "spin" },
  { label: "Services", href: "#services", icon: NimbusIcons.drop, fx: "drop" },
  { label: "Our Work", href: "#portfolio", icon: NimbusIcons.plane, fx: "plane" },
  { label: "Our Process", href: "#process", icon: NimbusIcons.user, fx: "wave" },
  {
    label: "Contact",
    href: "#contact",
    icon: NimbusIcons.user,
    fx: "pop",
  },
];

export default function App() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let frame = 0;

    const updateActiveItem = () => {
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const headerHeight =
          document.querySelector(".site-header")?.getBoundingClientRect().height ??
          0;
        const activationLine = Math.max(180, headerHeight + 160);
        const nextIndex = navigationItems.reduce((active, item, index) => {
          const sectionId = item.href?.slice(1);
          const section = sectionId ? document.getElementById(sectionId) : null;
          return section && section.getBoundingClientRect().top <= activationLine
            ? index
            : active;
        }, 0);

        setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
      });
    };

    updateActiveItem();
    window.addEventListener("scroll", updateActiveItem, { passive: true });
    window.addEventListener("resize", updateActiveItem);
    window.addEventListener("hashchange", updateActiveItem);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveItem);
      window.removeEventListener("resize", updateActiveItem);
      window.removeEventListener("hashchange", updateActiveItem);
    };
  }, []);

  return (
    <LiquidNavbar
      items={navigationItems}
      active={activeIndex}
      onChange={setActiveIndex}
      tone="light"
      sound={false}
      compact={false}
      className="seatech-navbar"
    />
  );
}
