import { GlassFolder } from "../../components/ui/glass-folder-cards";
import { WORK_CATEGORIES } from "../data/work-categories";

export default function AboutShowcase() {
  return (
    <div className="about-showcase">
      <GlassFolder categories={WORK_CATEGORIES} width={560} />
    </div>
  );
}
