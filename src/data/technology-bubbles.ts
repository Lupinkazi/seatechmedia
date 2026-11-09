export type TechnologyMark =
  | "github"
  | "vscode"
  | "react"
  | "nextjs"
  | "typescript"
  | "tailwind"
  | "gsap"
  | "figma"
  | "nodejs"
  | "davinciresolve"
  | "canon"
  | "dji"
  | "javascript"
  | "threejs"
  | "python"
  | "premierepro"
  | "aftereffects"
  | "blender"
  | "photoshop"
  | "blackmagicdesign"
  | "lenses"
  | "lighting"
  | "audio"
  | "drone";

export interface TechnologySphere {
  readonly id: string;
  readonly name: string;
  readonly mark: TechnologyMark;
}

export const TECHNOLOGY_SPHERES: readonly TechnologySphere[] = [
  { id: "github", name: "GitHub", mark: "github" },
  { id: "vscode", name: "Visual Studio Code", mark: "vscode" },
  { id: "react", name: "React", mark: "react" },
  { id: "nextjs", name: "Next.js", mark: "nextjs" },
  { id: "typescript", name: "TypeScript", mark: "typescript" },
  { id: "tailwind", name: "Tailwind CSS", mark: "tailwind" },
  { id: "gsap", name: "GSAP", mark: "gsap" },
  { id: "figma", name: "Figma", mark: "figma" },
  { id: "nodejs", name: "Node.js", mark: "nodejs" },
  { id: "davinciresolve", name: "DaVinci Resolve", mark: "davinciresolve" },
  { id: "canon", name: "Canon", mark: "canon" },
  { id: "dji", name: "DJI", mark: "dji" },
  { id: "javascript", name: "JavaScript", mark: "javascript" },
  { id: "threejs", name: "Three.js", mark: "threejs" },
  { id: "python", name: "Python", mark: "python" },
  { id: "premierepro", name: "Adobe Premiere Pro", mark: "premierepro" },
  { id: "aftereffects", name: "Adobe After Effects", mark: "aftereffects" },
  { id: "blender", name: "Blender", mark: "blender" },
  { id: "photoshop", name: "Adobe Photoshop", mark: "photoshop" },
  { id: "blackmagicdesign", name: "Blackmagic Design", mark: "blackmagicdesign" },
  { id: "lenses", name: "Professional Camera Lenses", mark: "lenses" },
  { id: "lighting", name: "LED Lighting Equipment", mark: "lighting" },
  { id: "audio", name: "Wireless Audio Systems", mark: "audio" },
  { id: "drone", name: "Drone Camera Systems", mark: "drone" },
];
