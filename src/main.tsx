import { createRoot } from "react-dom/client";
import App from "./App";
import MurmurationWordmark from "../components/ui/murmuration-wordmark";
import AboutShowcase from "./components/AboutShowcase";
import AboutCopy from "./components/AboutCopy";
import Services from "./components/Services";
import WhyChoose from "./components/WhyChoose";
import WorkDeck from "./components/WorkDeck";
import PortfolioFilters from "./components/PortfolioFilters";
import TechnologyBallPit from "./components/TechnologyBallPit";
import FAQs from "./components/ui/text-reveal-faqs";
import ContactWithGlobe from "./components/ui/contact-with-globe";
import ScrollRevealContentA from "../components/ui/scroll-reveal-content-a";
import "./tailwind.css";

const mountPoint = document.getElementById("primary-nav-root");

if (!mountPoint) {
  throw new Error("The navigation mount point is missing from index.html.");
}

createRoot(mountPoint).render(<App />);

const heroWordmarkMount = document.getElementById("hero-wordmark-root");

if (!heroWordmarkMount) {
  throw new Error("The hero wordmark mount point is missing from index.html.");
}

createRoot(heroWordmarkMount).render(
  <h1 className="hero-title">
    <MurmurationWordmark
      word={"Creative Media.\nPowerful Digital Solutions."}
      birds={6000}
      palette={{ ink: "#111827" }}
      flyFor={2.7}
      holdFor={0.4}
      reeds={false}
      interactive
      fontFamily='"Inter", sans-serif'
      height="clamp(150px, 17vw, 240px)"
      className="hero-murmuration"
      transparent
    >
      <span className="mmw-heading" aria-hidden="true">
        {["Creative Media.", "Powerful Digital Solutions."].map((line, lineIndex) => (
          <span className="mmw-word-line" key={lineIndex}>
            {Array.from(line).map((character, characterIndex) => (
              <span className="mmw-glyph" data-mmw-glyph key={characterIndex}>
                {character === " " ? "\u00a0" : character}
              </span>
            ))}
          </span>
        ))}
      </span>
    </MurmurationWordmark>
  </h1>,
);

const aboutShowcaseMount = document.getElementById("about-showcase-root");
if (!aboutShowcaseMount) {
  throw new Error("The About showcase mount point is missing from index.html.");
}
createRoot(aboutShowcaseMount).render(<AboutShowcase />);

const aboutCopyMount = document.getElementById("about-copy-root");
if (!aboutCopyMount) {
  throw new Error("The About copy mount point is missing from index.html.");
}
createRoot(aboutCopyMount).render(<AboutCopy />);

const servicesMount = document.getElementById("services-root");
if (!servicesMount) {
  throw new Error("The Services mount point is missing from index.html.");
}
createRoot(servicesMount).render(<Services />);

const whyChooseMount = document.getElementById("why-choose-root");
if (!whyChooseMount) {
  throw new Error("The Why Choose mount point is missing from index.html.");
}
createRoot(whyChooseMount).render(<WhyChoose />);

const workDeckMount = document.getElementById("portfolio-deck-root");
if (!workDeckMount) {
  throw new Error("The work deck mount point is missing from index.html.");
}
createRoot(workDeckMount).render(<WorkDeck />);

// PortfolioFilters replaces the vanilla-JS createPortfolioFilters() call.
// The #portfolio-filters element is marked with data-react-filters="true" so
// js/main.js skips its own button-creation when it sees that attribute.
const filtersMount = document.getElementById("portfolio-filters");
if (filtersMount) {
  filtersMount.setAttribute("data-react-filters", "true");
  createRoot(filtersMount).render(<PortfolioFilters />);
}

const processMount = document.getElementById("process-root");
if (!processMount) {
  throw new Error("The process mount point is missing from index.html.");
}
createRoot(processMount).render(<ScrollRevealContentA />);

const equipmentMount = document.getElementById("equipment-root");
if (!equipmentMount) {
  throw new Error("The equipment mount point is missing from index.html.");
}
createRoot(equipmentMount).render(<TechnologyBallPit />);

const faqMount = document.getElementById("faq-root");
if (!faqMount) {
  throw new Error("The FAQ mount point is missing from index.html.");
}
createRoot(faqMount).render(<FAQs />);

const contactMount = document.getElementById("contact-root");
if (!contactMount) {
  throw new Error("The contact mount point is missing from index.html.");
}
createRoot(contactMount).render(<ContactWithGlobe />);
