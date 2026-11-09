import MotionScrollWordReveal from "../../components/ui/motion-scroll-word-reveal";

const ABOUT_TEXT = [
  "ABOUT SEATECHMEDIA",
  "Where Creativity Meets Technology",
  "SeaTechMedia is a creative media and digital solutions company focused on delivering professional media production, digital communication, marketing, and technology solutions. We bring creative ideas and technical expertise together to help individuals, organizations, and businesses establish their identity, reach their audiences, and achieve their objectives.",
  "MISSION",
  "To help brands and organizations communicate clearly through creative media, impactful storytelling, thoughtful marketing, and connected digital experiences.",
  "VISION",
  "To become a trusted creative partner for businesses and organizations seeking integrated media, marketing, and digital solutions that create meaningful and lasting impact.",
  "Creativity",
  "Professionalism",
  "Innovation",
  "Quality",
  "Reliability",
  "Customer Satisfaction",
];

const totalWords = ABOUT_TEXT.reduce(
  (count, text) => count + text.trim().split(/\s+/).length,
  0,
);

export default function AboutCopy() {
  return (
    <MotionScrollWordReveal totalWords={totalWords} className="about-copy">
      {(text) => (
        <>
          <p className="section-tag">{text("ABOUT SEATECHMEDIA")}</p>
          <h2 id="about-title">{text("Where Creativity Meets Technology")}</h2>
          <p className="about-description">
            {text(
              "SeaTechMedia is a creative media and digital solutions company focused on delivering professional media production, digital communication, marketing, and technology solutions. We bring creative ideas and technical expertise together to help individuals, organizations, and businesses establish their identity, reach their audiences, and achieve their objectives.",
            )}
          </p>

          <div className="about-pillars">
            <article className="about-pillar">
              <h3>{text("MISSION")}</h3>
              <p>
                {text(
                  "To help brands and organizations communicate clearly through creative media, impactful storytelling, thoughtful marketing, and connected digital experiences.",
                )}
              </p>
            </article>
            <article className="about-pillar">
              <h3>{text("VISION")}</h3>
              <p>
                {text(
                  "To become a trusted creative partner for businesses and organizations seeking integrated media, marketing, and digital solutions that create meaningful and lasting impact.",
                )}
              </p>
            </article>
          </div>

          <ul className="about-values" aria-label="Company values">
            {[
              "Creativity",
              "Professionalism",
              "Innovation",
              "Quality",
              "Reliability",
              "Customer Satisfaction",
            ].map((value) => (
              <li key={value}>
                <span>{text(value)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </MotionScrollWordReveal>
  );
}
