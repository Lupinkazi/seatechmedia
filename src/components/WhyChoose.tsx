import { RIFFLE_CARDS } from "../data/riffle-cards";
import Riffle from "./ui/hairline-riffle";

export default function WhyChoose() {
  return (
    <div className="why-feature">
      <div className="why-feature__intro">
        <p className="section-tag">WHY CHOOSE SEATECHMEDIA</p>
        <h2>More Than <span className="why-feature__accent">Creative.</span><br />Built to Make an Impact.</h2>
      </div>
      <Riffle cards={RIFFLE_CARDS} />
    </div>
  );
}
