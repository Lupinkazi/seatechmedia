# Bird Murmuration Initial Animation

This document collects the source code and wiring for the initial bird-murmuration text animation. It is a reference copy: the website executes the `.tsx`, `.html`, and `.css` source files listed below. Keep this document synchronized when those files change.

## Timing

In normal-motion mode, the hero uses a 2.7-second free flight, a 1.2-second gather, and a 0.4-second stabilization. The final crossfade lasts 0.85 seconds, so the complete intro takes 5.15 seconds. The particle positions are locked to their text targets for the crossfade. Reduced-motion mode retains the shorter 0.45-second gather, 0.15-second hold, and 0.25-second crossfade (about 3.55 seconds total), while keeping the lower motion scale.

## HTML mount point and app entry

From `index.html`:

```html
<div id="hero-wordmark-root" class="hero-title-root">
  <h1 class="hero-title">Creative Media. Powerful Digital Solutions.</h1>
</div>

<script type="module" src="/js/main.js"></script>
<script type="module" src="/src/main.tsx"></script>
```

The `src/main.tsx` entry mounts the animation in that element and supplies the hero text, appearance, and timing:

```tsx
import { createRoot } from "react-dom/client";
import App from "./App";
import MurmurationWordmark from "../components/ui/murmuration-wordmark";
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
```

## Full animation component

Source: `components/ui/murmuration-wordmark.tsx`.

````tsx
"use client"

import * as React from "react"

export interface MurmurationPalette {
  skyTop: string
  skyLow: string
  sun: string
  ink: string
}

export type MurmurationPreset = "dusk" | "dawn" | "paper" | "night"

export interface MurmurationWordmarkProps {
  word?: string
  birds?: number
  preset?: MurmurationPreset
  palette?: { skyTop?: string; skyLow?: string; sun?: string; ink?: string }
  flyFor?: number
  holdFor?: number
  reeds?: boolean
  interactive?: boolean
  interactionRadius?: number
  reformDuration?: number
  interactionStrength?: number
  particleDensity?: number
  introOnce?: boolean
  fontFamily?: string
  children?: React.ReactNode
  height?: string
  className?: string
  transparent?: boolean
}

const PRESETS: { [K in MurmurationPreset]: MurmurationPalette } = {
  dusk: { skyTop: "#1d2b44", skyLow: "#e89a6a", sun: "#ffd2a0", ink: "#14100f" },
  dawn: { skyTop: "#9fb4c9", skyLow: "#f3d6c2", sun: "#fff3df", ink: "#1f2329" },
  paper: { skyTop: "#efe9dd", skyLow: "#e6ddcc", sun: "#ffffff", ink: "#1a1714" },
  night: { skyTop: "#05070d", skyLow: "#1a2236", sun: "#4a5d86", ink: "#dfe6f5" },
}

const SANS_STACK = '"Inter", "Helvetica Neue", Arial, system-ui, sans-serif'

function mmwRandom(seed: number) {
  let a = (seed >>> 0) || 1
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function mmwCurl(x: number, y: number, t: number) {
  const a = 1.7 * x + t
  const b = 1.3 * y - 0.6 * t
  const c = 2.9 * y + 1.1 * x - 0.8 * t
  const d = 4.3 * x - 3.7 * y + 1.3 * t
  const dpdx =
    1.7 * Math.cos(a) * Math.cos(b) +
    0.6 * 1.1 * Math.cos(c) -
    0.35 * 4.3 * Math.sin(d)
  const dpdy =
    -1.3 * Math.sin(a) * Math.sin(b) +
    0.6 * 2.9 * Math.cos(c) +
    0.35 * 3.7 * Math.sin(d)
  return [dpdy, -dpdx]
}

function mmwCentre(t: number) {
  return [
    0.42 * Math.sin(t * 0.21) + 0.12 * Math.sin(t * 0.53 + 1),
    0.16 * Math.sin(t * 0.33 + 2) - 0.08,
  ]
}

function mmwEase(k: number) {
  const x = k < 0 ? 0 : k > 1 ? 1 : k
  return x * x * (3 - 2 * x)
}

function mmwAssign(birds: number, points: number, seed: number) {
  const out = new Int32Array(birds)
  if (points <= 0) return out.fill(-1)
  const order = new Int32Array(points)
  for (let i = 0; i < points; i++) order[i] = i
  const rand = mmwRandom(seed)
  for (let i = points - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = order[i]
    order[i] = order[j]
    order[j] = tmp
  }
  for (let i = 0; i < birds; i++) out[i] = order[i % points]
  return out
}

function mmwAlpha(hex: string, alpha: number) {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim())
  if (!match) return hex
  const value =
    match[1].length === 3
      ? match[1].split("").map((character) => character + character).join("")
      : match[1]
  return `rgba(${parseInt(value.slice(0, 2), 16)},${parseInt(value.slice(2, 4), 16)},${parseInt(value.slice(4, 6), 16)},${alpha})`
}

const MMW_CSS = `
.mmw-root { position: relative; width: 100%; overflow: hidden; isolation: isolate; background: var(--mmw-sky); }
.mmw-root.mmw-transparent { background: transparent; }
.mmw-root canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; max-width: none; opacity: 0; transition: opacity var(--mmw-intro-fade, 850ms) cubic-bezier(0.22, 0.7, 0.2, 1); pointer-events: none; }
.mmw-root.mmw-animating:not(.mmw-intro-ending) canvas { opacity: 1; transition: none; }
.mmw-root.mmw-intro-ending canvas { opacity: 0; transition: opacity var(--mmw-intro-fade, 850ms) cubic-bezier(0.22, 0.7, 0.2, 1); }
.mmw-root.mmw-interactive canvas { opacity: 1; }
.mmw-over { position: relative; z-index: 1; height: 100%; pointer-events: none; }
.mmw-heading { position: absolute; top: 50%; left: 50%; display: block; width: 100%; transform: translate(-50%, -50%); color: var(--mmw-ink); font-family: var(--mmw-font); font-size: clamp(2rem, 5.3vw, 4.5rem); font-weight: 900; line-height: 1.08; text-align: center; opacity: 1; transition: opacity var(--mmw-intro-fade, 850ms) cubic-bezier(0.22, 0.7, 0.2, 1); }
.mmw-root.mmw-animating:not(.mmw-intro-ending) .mmw-heading { opacity: 0; transition: none; }
.mmw-root.mmw-intro-ending .mmw-heading { opacity: 1; transition: opacity var(--mmw-intro-fade, 850ms) cubic-bezier(0.22, 0.7, 0.2, 1); }
.mmw-root.mmw-intro-ending canvas,
.mmw-root.mmw-intro-ending .mmw-heading { transition-duration: var(--mmw-intro-fade, 850ms) !important; }
.mmw-word-line { display: block; }
.mmw-glyph { display: inline-block; white-space: pre; }
.mmw-root.mmw-interactive .mmw-glyph { opacity: var(--mmw-glyph-opacity, 1); }
.mmw-over [data-interactive], .mmw-over a, .mmw-over button { pointer-events: auto; }
.mmw-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
`

export default function MurmurationWordmark({
  word = "flock",
  birds = 4200,
  preset = "dusk",
  palette,
  flyFor = 7,
  holdFor = 3.2,
  reeds = true,
  interactive = true,
  interactionRadius = 48,
  reformDuration = 2000,
  interactionStrength = 1,
  particleDensity = 1,
  introOnce = true,
  fontFamily = SANS_STACK,
  children,
  height = "100svh",
  className = "",
  transparent = false,
}: MurmurationWordmarkProps) {
  const colors = { ...(PRESETS[preset] || PRESETS.dusk), ...(palette || {}) }
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const introHasRunRef = React.useRef(false)
  const opts = React.useRef({
    flyFor,
    holdFor,
    interactive,
    interactionRadius,
    reformDuration,
    interactionStrength,
    particleDensity,
    introOnce,
  })
  opts.current = {
    flyFor,
    holdFor,
    interactive,
    interactionRadius,
    reformDuration,
    interactionStrength,
    particleDensity,
    introOnce,
  }
  const key = [
    word,
    birds,
    colors.skyTop,
    colors.skyLow,
    colors.sun,
    colors.ink,
    reeds,
    fontFamily,
    transparent,
    particleDensity,
    introOnce,
  ].join("|")

  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let w = 1
    let h = 1
    let dpr = 1
    let n = 0
    let raf = 0
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    root.style.setProperty("--mmw-intro-fade", reducedMotion ? "250ms" : "850ms")
    let introPlaying = !introOnce || !introHasRunRef.current
    let visible = true
    let pointerX = -1e4
    let pointerY = -1e4
    let pointerActive = false
    let pointerReleaseTimer = 0
    let hasDisturbance = false
    let hasSeededFlight = false
    let pull = 1
    let sky: HTMLCanvasElement | null = null
    let px = new Float32Array(0)
    let py = new Float32Array(0)
    let vx = new Float32Array(0)
    let vy = new Float32Array(0)
    let depth = new Float32Array(0)
    let phase = new Float32Array(0)
    let target = new Int32Array(0)
    let tx = new Float32Array(0)
    let ty = new Float32Array(0)
    let disturbed = new Uint8Array(0)
    let recoveryStarted = new Float64Array(0)
    let particleGlyph = new Int16Array(0)
    let glyphElements: HTMLElement[] = []
    let glyphParticleCount = new Int32Array(0)
    let glyphOpacity = new Float32Array(0)
    let previousGlyphOpacity = new Float32Array(0)
    let last = performance.now()
    let clock = 0
    const rand = mmwRandom(11)

    const layout = () => {
      const rect = root.getBoundingClientRect()
      w = Math.max(1, Math.round(rect.width))
      h = Math.max(1, Math.round(rect.height))
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const pixelWidth = Math.round(w * dpr)
      const pixelHeight = Math.round(h * dpr)
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight

      sky = document.createElement("canvas")
      sky.width = canvas.width
      sky.height = canvas.height
      const skyContext = sky.getContext("2d")
      if (skyContext) {
        skyContext.setTransform(dpr, 0, 0, dpr, 0, 0)
        const gradient = skyContext.createLinearGradient(0, 0, 0, h)
        gradient.addColorStop(0, colors.skyTop)
        gradient.addColorStop(0.78, colors.skyLow)
        gradient.addColorStop(1, colors.skyLow)
        skyContext.fillStyle = gradient
        skyContext.fillRect(0, 0, w, h)
        const sun = skyContext.createRadialGradient(
          w * 0.62,
          h * 0.86,
          0,
          w * 0.62,
          h * 0.86,
          Math.max(w, h) * 0.55,
        )
        sun.addColorStop(0, colors.sun)
        sun.addColorStop(0.25, mmwAlpha(colors.sun, 0.5))
        sun.addColorStop(1, mmwAlpha(colors.sun, 0))
        skyContext.globalAlpha = 0.55
        skyContext.fillStyle = sun
        skyContext.fillRect(0, 0, w, h)
        skyContext.globalAlpha = 1
        const grain = mmwRandom(5)
        for (let i = 0; i < (w * h) / 10; i++) {
          skyContext.fillStyle =
            grain() < 0.5 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.035)"
          skyContext.fillRect(grain() * w, grain() * h, 1, 1)
        }
        if (reeds) {
          skyContext.strokeStyle = colors.ink
          skyContext.fillStyle = colors.ink
          const base = h - Math.max(6, h * 0.012)
          skyContext.fillRect(0, base, w, h - base)
          for (let x = -10; x < w + 10; x += 2 + grain() * 9) {
            if (grain() < 0.18) x += grain() * 30
            const tall = Math.pow(grain(), 1.6) * Math.max(34, h * 0.13) + 6
            const lean = (grain() - 0.3) * 10
            skyContext.lineWidth = 0.6 + grain() * 1.2
            skyContext.beginPath()
            skyContext.moveTo(x, base + 2)
            skyContext.quadraticCurveTo(
              x + lean * 0.3,
              base - tall * 0.6,
              x + lean,
              base - tall,
            )
            skyContext.stroke()
            if (grain() < 0.07) {
              skyContext.beginPath()
              skyContext.ellipse(
                x + lean,
                base - tall - 4,
                1.8,
                6,
                lean * 0.04,
                0,
                Math.PI * 2,
              )
              skyContext.fill()
            }
          }
        }
      }

      const mask = document.createElement("canvas")
      mask.width = w
      mask.height = h
      const maskContext = mask.getContext("2d", { willReadFrequently: true })
      const points: number[] = []
      if (maskContext) {
        const lines = (word || " ").split("\n")
        const heading = root.querySelector<HTMLElement>(".mmw-heading")
        const headingStyle = heading ? window.getComputedStyle(heading) : null
        const fontSize = headingStyle
          ? Number.parseFloat(headingStyle.fontSize)
          : 100
        const lineHeightValue = headingStyle
          ? Number.parseFloat(headingStyle.lineHeight)
          : Number.NaN
        const lineHeightRatio = Number.isFinite(lineHeightValue)
          ? lineHeightValue / fontSize
          : 1.08
        const lineHeight = fontSize * lineHeightRatio
        maskContext.font = headingStyle
          ? `${headingStyle.fontWeight} ${fontSize}px ${headingStyle.fontFamily}`
          : `900 ${fontSize}px ${fontFamily}`
        const widestLine = Math.max(
          ...lines.map((line) => maskContext.measureText(line || " ").width),
          1,
        )
        const sizeScale = Math.min(
          1,
          (w * 0.94) / widestLine,
          (h * 0.72) / (lines.length * lineHeight),
        )
        const size = fontSize * sizeScale
        maskContext.font = headingStyle
          ? `${headingStyle.fontWeight} ${size}px ${headingStyle.fontFamily}`
          : `900 ${size}px ${fontFamily}`
        maskContext.textAlign = "center"
        maskContext.textBaseline = "middle"
        const scaledLineHeight = lineHeight * sizeScale
        lines.forEach((line, index) => {
          const y =
            h / 2 + (index - (lines.length - 1) / 2) * scaledLineHeight
          maskContext.fillText(line, w / 2, y)
        })
        const image = maskContext.getImageData(0, 0, w, h).data
        const step = Math.max(2, Math.round(Math.sqrt((w * h) / 90000)))
        for (let y = 0; y < h; y += step) {
          for (let x = 0; x < w; x += step) {
            if (image[(y * w + x) * 4 + 3] > 128) {
              points.push(x + (rand() - 0.5) * step, y + (rand() - 0.5) * step)
            }
          }
        }
      }
      tx = new Float32Array(points.filter((_, index) => index % 2 === 0))
      ty = new Float32Array(points.filter((_, index) => index % 2 === 1))
      glyphElements = Array.from(
        root.querySelectorAll<HTMLElement>("[data-mmw-glyph]"),
      )
      const glyphBounds = glyphElements.map((glyph) => {
        const bounds = glyph.getBoundingClientRect()
        return {
          left: bounds.left - rect.left,
          right: bounds.right - rect.left,
          top: bounds.top - rect.top,
          bottom: bounds.bottom - rect.top,
          centerX: (bounds.left + bounds.right) / 2 - rect.left,
          centerY: (bounds.top + bounds.bottom) / 2 - rect.top,
        }
      })

      const want = Math.round(
        Math.max(600, Math.min(9000, birds)) *
          Math.min(1, w / 1440) *
          Math.max(0.2, Math.min(2, particleDensity)),
      )
      if (want !== n) {
        n = Math.max(500, want)
        px = new Float32Array(n)
        py = new Float32Array(n)
        vx = new Float32Array(n)
        vy = new Float32Array(n)
        depth = new Float32Array(n)
        phase = new Float32Array(n)
        disturbed = new Uint8Array(n)
        recoveryStarted = new Float64Array(n)
        particleGlyph = new Int16Array(n)
        glyphParticleCount = new Int32Array(glyphElements.length)
        glyphOpacity = new Float32Array(glyphElements.length).fill(1)
        previousGlyphOpacity = new Float32Array(glyphElements.length).fill(1)
        for (let i = 0; i < n; i++) {
          const angle = rand() * Math.PI * 2
          const radius = Math.sqrt(rand())
          px[i] = w * 0.5 + Math.cos(angle) * radius * w * 0.22
          py[i] = h * 0.4 + Math.sin(angle) * radius * h * 0.16
          depth[i] = 0.55 + rand() * 0.45
          phase[i] = rand() * Math.PI * 2
          particleGlyph[i] = -1
        }
      }
      target = mmwAssign(n, tx.length, 23)
      glyphParticleCount.fill(0)
      pull = introPlaying ? 0 : 1
      for (let i = 0; i < n; i++) {
        const point = target[i]
        if (point < 0) continue
        if (!introPlaying) {
          px[i] = tx[point]
          py[i] = ty[point]
          vx[i] = 0
          vy[i] = 0
        }
        let closestGlyph = -1
        let closestDistance = Number.POSITIVE_INFINITY
        for (let glyphIndex = 0; glyphIndex < glyphBounds.length; glyphIndex++) {
          const bounds = glyphBounds[glyphIndex]
          if (
            tx[point] >= bounds.left &&
            tx[point] <= bounds.right &&
            ty[point] >= bounds.top &&
            ty[point] <= bounds.bottom
          ) {
            closestGlyph = glyphIndex
            break
          }
          const distance = Math.hypot(
            tx[point] - bounds.centerX,
            ty[point] - bounds.centerY,
          )
          if (distance < closestDistance) {
            closestDistance = distance
            closestGlyph = glyphIndex
          }
        }
        particleGlyph[i] = closestGlyph
        if (closestGlyph >= 0) glyphParticleCount[closestGlyph]++
      }
      if (introPlaying && !hasSeededFlight) {
        for (let i = 0; i < n; i++) {
          px[i] = rand() * w
          py[i] = rand() * h
          vx[i] = (rand() - 0.5) * 90
          vy[i] = (rand() - 0.5) * 70
        }
        hasSeededFlight = true
      }
      disturbed.fill(0)
      recoveryStarted.fill(0)
      hasDisturbance = false
      root.classList.remove("mmw-interactive")
    }

    const frame = (now: number) => {
      raf = 0
      const elapsed = Math.max(0, (now - last) / 1000)
      const dt = Math.min(0.05, elapsed)
      last = now
      if (introPlaying) clock += elapsed
      const options = opts.current
      const flyDuration = Math.max(0.1, options.flyFor)
      const gatherDuration = reducedMotion ? 0.45 : 1.2
      const holdDuration = reducedMotion
        ? 0.15
        : Math.max(0.1, options.holdFor)
      const crossfadeDuration = reducedMotion ? 0.25 : 0.85
      const crossfadeStart = flyDuration + gatherDuration + holdDuration
      const introDuration = crossfadeStart + crossfadeDuration
      if (introPlaying && clock >= crossfadeStart) {
        root.classList.add("mmw-intro-ending")
        for (let i = 0; i < n; i++) {
          const point = target[i]
          if (point < 0) continue
          px[i] = tx[point]
          py[i] = ty[point]
          vx[i] = 0
          vy[i] = 0
        }
      }
      if (introPlaying && clock >= introDuration) {
        introPlaying = false
        introHasRunRef.current = true
        pull = 1
        for (let i = 0; i < n; i++) {
          const point = target[i]
          if (point < 0) continue
          px[i] = tx[point]
          py[i] = ty[point]
          vx[i] = 0
          vy[i] = 0
        }
        root.classList.remove("mmw-animating", "mmw-intro-ending")
      }
      let targetPull = 1
      if (introPlaying) {
        targetPull = 0
        if (clock > flyDuration && clock <= flyDuration + gatherDuration) {
          targetPull = mmwEase((clock - flyDuration) / gatherDuration)
        } else if (clock > flyDuration + gatherDuration) {
          targetPull = 1
        }
      }
      pull +=
        (targetPull - pull) *
        (1 - Math.exp(-dt * 4))

      const unit = Math.min(w, h)
      const center = mmwCentre(clock)
      const centerX = w / 2 + center[0] * w * 0.5
      const centerY = h * 0.42 + center[1] * h
      const time = clock * 0.35
      const motionScale = reducedMotion ? 0.3 : 1

      glyphOpacity.fill(0)
      let unsettled = false
      for (let i = 0; i < n; i++) {
        const x = px[i]
        const y = py[i]
        const targetIndex = target[i]
        let ax = 0
        let ay = 0
        let opacity = 1
        let active = false
        if (!introPlaying && opts.current.interactive && pointerActive && targetIndex >= 0) {
          const targetX = tx[targetIndex]
          const targetY = ty[targetIndex]
          const radius = Math.max(
            24,
            opts.current.interactionRadius * Math.min(1, w / 900),
          )
          active =
            Math.hypot(targetX - pointerX, targetY - pointerY) < radius
        }

        if (active && !disturbed[i]) {
          const dx = x - pointerX
          const dy = y - pointerY
          const distance = Math.max(1, Math.hypot(dx, dy))
          const strength = Math.max(0, opts.current.interactionStrength)
          const impulse = (100 + rand() * 110) * strength
          vx[i] += (dx / distance) * impulse - (dy / distance) * impulse * 0.16
          vy[i] += (dy / distance) * impulse + (dx / distance) * impulse * 0.16
          recoveryStarted[i] = 0
        } else if (!active && disturbed[i]) {
          recoveryStarted[i] = now
        }
        disturbed[i] = active ? 1 : 0

        if (introPlaying) {
          const fx = (x - w / 2) / unit
          const fy = (y - h / 2) / unit
          const current = mmwCurl(
            fx * 2.2 + depth[i] * 0.25,
            fy * 2.2,
            time,
          )
          const free = 1 - pull
          ax += current[0] * 420 * free * motionScale
          ay += current[1] * 420 * free * motionScale
          const dxCenter = centerX - x
          const dyCenter = (centerY - y) * 1.6
          const centerDistance = Math.hypot(dxCenter, dyCenter) / unit
          const hold = centerDistance < 0.14 ? 0.15 : 0.15 + (centerDistance - 0.14) * 6
          ax += dxCenter * hold * 2.2 * free * motionScale
          ay += dyCenter * hold * 1.6 * free * motionScale
          if (pull > 0 && targetIndex >= 0) {
            ax += (tx[targetIndex] - x) * 9 * pull - vx[i] * 3.2 * pull
            ay += (ty[targetIndex] - y) * 9 * pull - vy[i] * 3.2 * pull
          }
          phase[i] += dt * (9 + Math.hypot(vx[i], vy[i]) * 0.02)
        } else if (active) {
          let dx = x - pointerX
          let dy = y - pointerY
          let distance = Math.hypot(dx, dy)
          if (distance < 1) {
            dx = Math.cos(phase[i])
            dy = Math.sin(phase[i])
            distance = 1
          }
          const force = Math.max(0, opts.current.interactionStrength)
          const fieldRadius = Math.max(
            24,
            opts.current.interactionRadius * Math.min(1, w / 900),
          )
          const desiredDistance = fieldRadius * (1.15 + depth[i] * 0.45)
          const radialError = desiredDistance - distance
          const tangential = Math.sin(phase[i]) * 12 * force
          ax += (dx / distance) * radialError * 18 * force -
            (dy / distance) * tangential -
            vx[i] * 8
          ay += (dy / distance) * radialError * 18 * force +
            (dx / distance) * tangential -
            vy[i] * 8
          opacity = 0
          unsettled = true
          phase[i] += dt * (8 + Math.hypot(vx[i], vy[i]) * 0.025)
        } else if (recoveryStarted[i] > 0) {
          const elapsedRecovery = now - recoveryStarted[i]
          const duration = Math.max(1, opts.current.reformDuration)
          const progress = Math.min(1, elapsedRecovery / duration)
          const easedProgress = mmwEase(progress)
          opacity = easedProgress
          if (progress >= 1 || targetIndex < 0) {
            px[i] = targetIndex >= 0 ? tx[targetIndex] : x
            py[i] = targetIndex >= 0 ? ty[targetIndex] : y
            vx[i] = 0
            vy[i] = 0
            recoveryStarted[i] = 0
          } else {
            ax += (tx[targetIndex] - x) * (4 + 15 * easedProgress) - vx[i] * 6
            ay += (ty[targetIndex] - y) * (4 + 15 * easedProgress) - vy[i] * 6
            unsettled = true
          }
        } else if (targetIndex >= 0) {
          px[i] = tx[targetIndex]
          py[i] = ty[targetIndex]
          vx[i] = 0
          vy[i] = 0
        }

        const glyphIndex = particleGlyph[i]
        if (glyphIndex >= 0) glyphOpacity[glyphIndex] += opacity
        if (active) unsettled = true
        if (introPlaying || active || recoveryStarted[i] > 0) {
          let nextVx = (vx[i] + ax * dt) * (1 - 1.1 * dt)
          let nextVy = (vy[i] + ay * dt) * (1 - 1.1 * dt)
          const speed = Math.hypot(nextVx, nextVy)
          const speedCap = introPlaying ? 520 + 380 * pull : 250
          if (speed > speedCap) {
            nextVx = (nextVx / speed) * speedCap
            nextVy = (nextVy / speed) * speedCap
          }
          vx[i] = nextVx
          vy[i] = nextVy
          px[i] += nextVx * dt
          py[i] += nextVy * dt
        }
      }
      glyphOpacity.forEach((value, index) => {
        const count = glyphParticleCount[index]
        const opacity = count > 0 ? value / count : 1
        if (Math.abs(opacity - previousGlyphOpacity[index]) > 0.01) {
          glyphElements[index]?.style.setProperty(
            "--mmw-glyph-opacity",
            opacity.toFixed(3),
          )
          previousGlyphOpacity[index] = opacity
        }
      })
      if (unsettled !== hasDisturbance) {
        hasDisturbance = unsettled
        root.classList.toggle("mmw-interactive", unsettled)
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      if (transparent) ctx.clearRect(0, 0, canvas.width, canvas.height)
      else if (sky) ctx.drawImage(sky, 0, 0)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (introPlaying) {
        for (let pass = 0; pass < 2; pass++) {
          ctx.beginPath()
          for (let i = 0; i < n; i++) {
            const near = depth[i] > 0.78
            if ((pass === 1) !== near) continue
            const size = (1.6 + depth[i] * 2.2) * (1 - 0.35 * pull)
            const speed = Math.hypot(vx[i], vy[i])
            const dx = speed > 0.01 ? vx[i] / speed : Math.cos(phase[i])
            const dy = speed > 0.01 ? vy[i] / speed : Math.sin(phase[i])
            const flap = 0.55 + 0.45 * Math.sin(phase[i])
            const wingX = -dx * size
            const wingY = -dy * size
            const normalX = -dy * size * flap
            const normalY = dx * size * flap
            ctx.moveTo(px[i] + wingX + normalX, py[i] + wingY + normalY)
            ctx.lineTo(px[i], py[i])
            ctx.lineTo(px[i] + wingX - normalX, py[i] + wingY - normalY)
          }
          ctx.strokeStyle = colors.ink
          ctx.globalAlpha = pass === 0 ? 0.55 : 0.92
          ctx.lineWidth = pass === 0 ? 0.9 : 1.25
          ctx.stroke()
        }
      } else if (hasDisturbance) {
        ctx.beginPath()
        for (let i = 0; i < n; i++) {
          if (!disturbed[i] && recoveryStarted[i] === 0) continue
          const size = 1.2 + depth[i] * 1.8
          const speed = Math.hypot(vx[i], vy[i])
          const dx = speed > 0.01 ? vx[i] / speed : Math.cos(phase[i])
          const dy = speed > 0.01 ? vy[i] / speed : Math.sin(phase[i])
          const flap = 0.5 + 0.5 * Math.sin(phase[i])
          const wingX = -dx * size
          const wingY = -dy * size
          const normalX = -dy * size * flap
          const normalY = dx * size * flap
          ctx.moveTo(px[i] + wingX + normalX, py[i] + wingY + normalY)
          ctx.lineTo(px[i], py[i])
          ctx.lineTo(px[i] + wingX - normalX, py[i] + wingY - normalY)
          if (recoveryStarted[i] > 0) {
            ctx.globalAlpha = Math.max(0, 1 - (now - recoveryStarted[i]) / Math.max(1, opts.current.reformDuration))
          } else {
            ctx.globalAlpha = 0.9
          }
          ctx.strokeStyle = colors.ink
          ctx.lineWidth = 1.2
          ctx.stroke()
          ctx.beginPath()
        }
      }
      ctx.globalAlpha = 1

      if (introPlaying || hasDisturbance) scheduleFrame()
    }

    const scheduleFrame = () => {
      if (raf === 0) raf = requestAnimationFrame(frame)
    }

    const onMove = (event: PointerEvent) => {
      if (introPlaying || !opts.current.interactive) return
      if (pointerReleaseTimer) {
        window.clearTimeout(pointerReleaseTimer)
        pointerReleaseTimer = 0
      }
      const bounds = root.getBoundingClientRect()
      pointerX = event.clientX - bounds.left
      pointerY = event.clientY - bounds.top
      pointerActive = event.pointerType !== "touch" || event.buttons > 0
      scheduleFrame()
    }
    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch" || introPlaying || !opts.current.interactive) return
      pointerActive = true
      onMove(event)
    }
    const onUp = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        if (pointerReleaseTimer) window.clearTimeout(pointerReleaseTimer)
        pointerReleaseTimer = window.setTimeout(() => {
          pointerActive = false
          pointerReleaseTimer = 0
          scheduleFrame()
        }, 140)
        return
      }
      pointerActive = false
      scheduleFrame()
    }
    const onLeave = () => {
      if (pointerReleaseTimer) {
        window.clearTimeout(pointerReleaseTimer)
        pointerReleaseTimer = 0
      }
      pointerActive = false
      scheduleFrame()
    }

    if (introPlaying) root.classList.add("mmw-animating")
    else root.classList.remove("mmw-animating")
    layout()
    frame(performance.now())
    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerdown", onDown)
    root.addEventListener("pointerleave", onLeave)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    const resizeObserver = new ResizeObserver(() => {
      layout()
      scheduleFrame()
    })
    resizeObserver.observe(root)
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) scheduleFrame()
    })
    intersectionObserver.observe(root)
    let alive = true
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (alive) layout()
      })
    }
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      if (pointerReleaseTimer) window.clearTimeout(pointerReleaseTimer)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerdown", onDown)
      root.removeEventListener("pointerleave", onLeave)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [key])

  return (
    <div
      ref={rootRef}
      className={`mmw-root ${transparent ? "mmw-transparent" : ""} ${className}`}
      style={
        {
          height,
          "--mmw-sky": colors.skyTop,
          "--mmw-ink": colors.ink,
          "--mmw-font": fontFamily,
        } as React.CSSProperties
      }
    >
      <style>{MMW_CSS}</style>
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="mmw-sr">{word.replace(/\n/g, " ")}</span>
      {children ? <div className="mmw-over">{children}</div> : null}
    </div>
  )
}
````

## Related hero layout styles

From `css/style.css`:

```css
.hero-title-root {
  width: 100%;
}

.hero-title {
  margin-bottom: 16px;
}

.hero-murmuration {
  width: 100%;
}
```

## Reduced-motion styles

From `css/style.css`:

```css
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .reveal {
    opacity: 1;
    transform: none;
  }

  .letter-swap-character {
    transform: none !important;
  }

  .contact-swap-button .contact-swap-face,
  .contact-swap-button .contact-swap-hover,
  .contact-swap-button .contact-swap-hover-fill {
    transition-duration: 200ms !important;
  }
}
```
