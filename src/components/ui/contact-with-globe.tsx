"use client";

import * as React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";
import { ArrowRight, Mail, Phone, MapPin, X } from "lucide-react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as d3 from "d3";
import { feature } from "topojson-client";
import type {
  Topology,
  GeometryCollection,
  GeometryObject,
} from "topojson-specification";
import type { GeoPermissibleObjects } from "d3";

const smoothEase = [0.25, 0.1, 0.25, 1] as const;

const CONTACT_LINKS = [
  {
    icon: Mail,
    label: "seatechp@gmail.com",
    href: "mailto:seatechp@gmail.com",
  },
  { icon: Phone, label: "9851084681", href: "tel:9851084681" },
  { icon: MapPin, label: "Sorakhutte, Nayabazar" },
];

const SERVICES = [
  "Photography",
  "Videography",
  "Digital Marketing",
  "Event Management",
  "Website Development",
  "Equipment Rental",
  "Training",
  "Other",
];

const INPUT_CLASS =
  "w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all duration-200";
const LABEL_CLASS =
  "text-xs font-semibold tracking-widest uppercase text-zinc-400";

interface GlobeWireframeProps {
  width?: number;
  height?: number;
  className?: string;
  strokeColor?: string;
  strokeWidth?: number;
  graticuleColor?: string;
  graticuleOpacity?: number;
  sphereOutlineColor?: string;
  sphereOutlineWidth?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  autoRotateAxis?: "longitude" | "center";
  rotateToLocation?: string | [number, number];
  rotateCities?: string[];
  rotationSpeed?: number;
  initialRotation?: [number, number];
  returnToInitialRotation?: boolean;
  enableInteraction?: boolean;
  showGraticule?: boolean;
  animationDuration?: number;
  startAsGlobe?: boolean;
  countryFillColor?: string;
  countryHoverColor?: string;
  variant?: "wireframe" | "wireframesolid" | "solid";
  scale?: number;
  backgroundColor?: string;
}

interface GeoFeature {
  type: string;
  geometry: GeometryObject;
  properties: Record<string, unknown>;
}

interface WorldAtlasTopology extends Topology {
  objects: {
    countries: GeometryCollection;
  };
}

interface CustomProjection extends d3.GeoProjection {
  alpha(value: number): CustomProjection;
  alpha(): number;
}

interface EarthGlobeRenderer {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  positionBuffer: WebGLBuffer;
  texture: WebGLTexture;
  positionLocation: number;
  centerLocation: WebGLUniformLocation;
  radiusLocation: WebGLUniformLocation;
  rotationLocation: WebGLUniformLocation;
  textureLocation: WebGLUniformLocation;
}

const earthVertexShader = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const earthFragmentShader = `
  precision mediump float;
  uniform vec2 center;
  uniform float radius;
  uniform vec3 rotation;
  uniform sampler2D earthTexture;

  void main() {
    vec2 point = (gl_FragCoord.xy - center) / radius;
    float distanceSquared = dot(point, point);
    if (distanceSquared > 1.0) discard;

    float depth = sqrt(1.0 - distanceSquared);
    vec3 geographic = vec3(depth, point.x, point.y);
    float cosGamma = cos(rotation.z);
    float sinGamma = sin(rotation.z);
    geographic = vec3(
      geographic.x,
      geographic.y * cosGamma + geographic.z * sinGamma,
      -geographic.y * sinGamma + geographic.z * cosGamma
    );

    float cosPhi = cos(rotation.y);
    float sinPhi = sin(rotation.y);
    geographic = vec3(
      geographic.x * cosPhi + geographic.z * sinPhi,
      geographic.y,
      -geographic.x * sinPhi + geographic.z * cosPhi
    );

    float cosLambda = cos(rotation.x);
    float sinLambda = sin(rotation.x);
    geographic = vec3(
      geographic.x * cosLambda + geographic.y * sinLambda,
      -geographic.x * sinLambda + geographic.y * cosLambda,
      geographic.z
    );

    float longitude = atan(geographic.y, geographic.x);
    float latitude = asin(clamp(geographic.z, -1.0, 1.0));
    vec2 uv = vec2(
      fract(0.5 + longitude / 6.28318530718),
      0.5 - latitude / 3.14159265359
    );
    gl_FragColor = texture2D(earthTexture, uv);
  }
`;

const cityCoordinates: Record<string, [number, number]> = {
  "san francisco": [37.7749, -122.4194],
  "new york": [40.7128, -74.006],
  london: [51.5074, -0.1278],
  tokyo: [35.6762, 139.6503],
  paris: [48.8566, 2.3522],
  moscow: [55.7558, 37.6176],
  dubai: [25.2048, 55.2708],
  singapore: [1.3521, 103.8198],
  sydney: [-33.8688, 151.2093],
  mumbai: [19.076, 72.8777],
  "los angeles": [34.0522, -118.2437],
  chicago: [41.8781, -87.6298],
};

function orthographicRaw(x: number, y: number): [number, number] {
  const cosy = Math.cos(y);
  return [cosy * Math.sin(x), Math.sin(y)];
}

function equirectangularRaw(lambda: number, phi: number): [number, number] {
  return [lambda, phi];
}

function interpolateProjection(
  raw0: (lambda: number, phi: number) => [number, number],
  raw1: (lambda: number, phi: number) => [number, number],
): CustomProjection {
  let t = 0;

  const createRawProjection = (
    alpha: number,
  ): ((lambda: number, phi: number) => [number, number]) => {
    return (lambda: number, phi: number): [number, number] => {
      const [x0, y0] = raw0(lambda, phi);
      const [x1, y1] = raw1(lambda, phi);
      return [x0 + alpha * (x1 - x0), y0 + alpha * (y1 - y0)];
    };
  };

  const projection = d3.geoProjection(
    createRawProjection(t),
  ) as unknown as CustomProjection;

  const alphaMethod = ((value?: number): CustomProjection | number => {
    if (value !== undefined) {
      t = +value;
      const newProjection = d3.geoProjection(
        createRawProjection(t),
      ) as unknown as CustomProjection;

      if (projection.scale()) newProjection.scale(projection.scale());
      if (projection.translate())
        newProjection.translate(projection.translate());
      if (projection.rotate()) newProjection.rotate(projection.rotate());
      if (projection.precision())
        newProjection.precision(projection.precision());

      newProjection.alpha = alphaMethod as CustomProjection["alpha"];

      return newProjection;
    }
    return t;
  }) as CustomProjection["alpha"];

  projection.alpha = alphaMethod;

  return projection;
}

export function GlobeWireframe({
  width,
  height,
  className = "aspect-square w-full max-w-[600px]",
  strokeColor = "currentColor",
  strokeWidth = 1.0,
  graticuleColor = "currentColor",
  graticuleOpacity = 0.2,
  sphereOutlineColor = "currentColor",
  sphereOutlineWidth = 1,
  autoRotate = true,
  autoRotateSpeed = 0.5,
  autoRotateAxis = "longitude",
  rotateToLocation,
  rotateCities = [],
  rotationSpeed = 3000,
  initialRotation = [0, 0],
  returnToInitialRotation = false,
  enableInteraction = true,
  showGraticule = true,
  animationDuration = 2000,
  startAsGlobe = true,
  countryFillColor,
  countryHoverColor,
  variant = "wireframe",
  scale = 1,
  backgroundColor,
}: GlobeWireframeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const earthCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [earthRenderer, setEarthRenderer] =
    useState<EarthGlobeRenderer | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(startAsGlobe ? 0 : 100);
  const [worldData, setWorldData] = useState<GeoFeature[]>([]);
  const [rotation, setRotation] = useState<[number, number, number]>([
    ...initialRotation,
    0,
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [lastMouse, setLastMouse] = useState([0, 0]);
  const [isVisible, setIsVisible] = useState(false);
  const rotationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const rotationAnimFrame = useRef<number | null>(null);
  const rotationStartTime = useRef<number | null>(null);
  const rotationFrom = useRef<[number, number, number]>([0, 0, 0]);
  const rotationTo = useRef<[number, number, number]>([0, 0, 0]);
  const animationFrame = useRef<number | null>(null);
  const [currentCityIndex, setCurrentCityIndex] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const rotationRef = useRef(rotation);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  const useResponsive = !width && !height;
  const finalWidth = useResponsive ? dimensions.width : width || 800;
  const finalHeight = useResponsive ? dimensions.height : height || 500;

  const defaultStrokeColor = strokeColor || "currentColor";
  const defaultGraticuleColor = graticuleColor || "currentColor";
  const defaultSphereOutlineColor = sphereOutlineColor || "currentColor";
  const defaultCountryFillColor =
    countryFillColor || (variant === "solid" ? "currentColor" : "none");
  const defaultBackgroundColor = backgroundColor || "transparent";

  useEffect(() => {
    const canvas = earthCanvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, antialias: true });
    if (!gl) {
      console.error("WebGL is unavailable; the satellite globe cannot render.");
      return;
    }

    const createShader = (
      type: number,
      source: string,
    ): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(
          "Unable to compile the satellite globe shader:",
          gl.getShaderInfoLog(shader),
        );
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl.VERTEX_SHADER, earthVertexShader);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, earthFragmentShader);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) {
      console.error("Unable to create the satellite globe renderer.");
      return;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(
        "Unable to link the satellite globe renderer:",
        gl.getProgramInfoLog(program),
      );
      gl.deleteProgram(program);
      return;
    }

    const positionBuffer = gl.createBuffer();
    const texture = gl.createTexture();
    const centerLocation = gl.getUniformLocation(program, "center");
    const radiusLocation = gl.getUniformLocation(program, "radius");
    const rotationLocation = gl.getUniformLocation(program, "rotation");
    const textureLocation = gl.getUniformLocation(program, "earthTexture");
    if (
      !positionBuffer ||
      !texture ||
      !centerLocation ||
      !radiusLocation ||
      !rotationLocation ||
      !textureLocation
    ) {
      console.error("Unable to initialize the satellite globe resources.");
      gl.deleteBuffer(positionBuffer);
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([19, 53, 78, 255]),
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const renderer: EarthGlobeRenderer = {
      gl,
      program,
      positionBuffer,
      texture,
      positionLocation: gl.getAttribLocation(program, "position"),
      centerLocation,
      radiusLocation,
      rotationLocation,
      textureLocation,
    };
    setEarthRenderer(renderer);

    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      setEarthRenderer({ ...renderer });
    };
    image.onerror = () => {
      console.error("Unable to load the NASA Blue Marble texture.");
    };
    image.src = new URL("../../../assets/earth-blue-marble.jpg", import.meta.url).href;

    return () => {
      active = false;
      image.onload = null;
      image.onerror = null;
      gl.deleteBuffer(positionBuffer);
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
      setEarthRenderer((current) => (current === renderer ? null : current));
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const updateDimensions = () => {
      if (container && useResponsive) {
        const width = container.offsetWidth || 300;
        setDimensions({ width, height: width });
      }
    };

    updateDimensions();

    if (useResponsive) {
      resizeObserver.current = new ResizeObserver(updateDimensions);
      resizeObserver.current.observe(container);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    observer.observe(container);

    return () => {
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
      }
      observer.unobserve(container);
    };
  }, [useResponsive]);

  useEffect(() => {
    const loadWorldData = async () => {
      try {
        const response = await fetch(
          "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
        );
        const world = (await response.json()) as WorldAtlasTopology;
        const countries = feature(world, world.objects.countries)
          .features as GeoFeature[];
        setWorldData(countries);
      } catch (error) {
        console.error("Error loading world data:", error);
        const fallbackData: GeoFeature[] = [
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [-180, -90],
                  [180, -90],
                  [180, 90],
                  [-180, 90],
                  [-180, -90],
                ],
              ],
            } as unknown as GeometryObject,
            properties: {},
          },
        ];
        setWorldData(fallbackData);
      }
    };
    loadWorldData();
  }, []);

  useEffect(() => {
    if (
      !autoRotate ||
      !isVisible ||
      isDragging ||
      isReturning ||
      rotateCities.length > 0
    ) {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
      return;
    }

    const rotate = () => {
      setRotation((prev) =>
        autoRotateAxis === "center"
          ? [prev[0], prev[1], (prev[2] + autoRotateSpeed) % 360]
          : [(prev[0] + autoRotateSpeed) % 360, prev[1], prev[2]],
      );
      animationFrame.current = requestAnimationFrame(rotate);
    };

    animationFrame.current = requestAnimationFrame(rotate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [
    autoRotate,
    autoRotateSpeed,
    autoRotateAxis,
    isVisible,
    isDragging,
    isReturning,
    rotateCities.length,
  ]);

  const animateRotationTo = useCallback(
    (
      target: [number, number],
      duration = 1200,
      onComplete?: () => void,
    ) => {
      if (rotationAnimFrame.current) {
        cancelAnimationFrame(rotationAnimFrame.current);
      }

      rotationFrom.current = rotationRef.current;
      rotationTo.current = [target[0], target[1], rotationRef.current[2]];
      rotationStartTime.current = performance.now();

      const animate = (time: number) => {
        const elapsed = time - (rotationStartTime.current || 0);
        const t = Math.min(elapsed / duration, 1);

        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        const lon =
          rotationFrom.current[0] +
          (rotationTo.current[0] - rotationFrom.current[0]) * eased;

        const lat =
          rotationFrom.current[1] +
          (rotationTo.current[1] - rotationFrom.current[1]) * eased;

        const roll =
          rotationFrom.current[2] +
          (rotationTo.current[2] - rotationFrom.current[2]) * eased;

        setRotation([lon, lat, roll]);

        if (t < 1) {
          rotationAnimFrame.current = requestAnimationFrame(animate);
        } else {
          rotationAnimFrame.current = null;
          onComplete?.();
        }
      };

      rotationAnimFrame.current = requestAnimationFrame(animate);
    },
    [],
  );

  const returnToInitialView = useCallback(() => {
    if (!returnToInitialRotation) return;
    setIsReturning(true);
    animateRotationTo(initialRotation, 1000, () => setIsReturning(false));
  }, [animateRotationTo, initialRotation, returnToInitialRotation]);

  useEffect(() => {
    if (rotateCities.length === 0 || !isVisible) return;

    const rotateToNextCity = () => {
      const nextIndex = (currentCityIndex + 1) % rotateCities.length;
      const city = rotateCities[nextIndex].toLowerCase();
      const coordinates = cityCoordinates[city];

      if (coordinates) {
        animateRotationTo(
          [-coordinates[1], -coordinates[0]],
          rotationSpeed * 0.6,
        );
        setCurrentCityIndex(nextIndex);
      }
    };

    const city = rotateCities[currentCityIndex].toLowerCase();
    const coordinates = cityCoordinates[city];

    if (coordinates) {
      animateRotationTo(
        [-coordinates[1], -coordinates[0]],
        rotationSpeed * 0.6,
      );
    }

    rotationInterval.current = setInterval(rotateToNextCity, rotationSpeed);

    return () => {
      if (rotationInterval.current) clearInterval(rotationInterval.current);
    };
  }, [
    rotateCities,
    currentCityIndex,
    rotationSpeed,
    isVisible,
    animateRotationTo,
  ]);

  useEffect(() => {
    if (!rotateToLocation) return;

    let coordinates: [number, number];
    if (typeof rotateToLocation === "string") {
      const city = rotateToLocation.toLowerCase();
      coordinates = cityCoordinates[city] || [0, 0];
    } else {
      coordinates = rotateToLocation;
    }

    setRotation((current) => [-coordinates[1], -coordinates[0], current[2]]);
  }, [rotateToLocation]);

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!enableInteraction) return;
    // Cancel a pending return animation so it can't fight the drag or leave isReturning stuck
    if (rotationAnimFrame.current) {
      cancelAnimationFrame(rotationAnimFrame.current);
      rotationAnimFrame.current = null;
    }
    setIsReturning(false);
    isDraggingRef.current = true;
    setIsDragging(true);
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      setLastMouse([event.clientX - rect.left, event.clientY - rect.top]);
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || !enableInteraction) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentMouse = [event.clientX - rect.left, event.clientY - rect.top];
    const dx = currentMouse[0] - lastMouse[0];
    const dy = currentMouse[1] - lastMouse[1];

    const t = progress / 100;
    let sensitivity: number;

    if (variant === "wireframe") {
      sensitivity = t < 0.5 ? 0.5 : 0.25;
    } else {
      sensitivity = 0.5;
    }

    setRotation((prev) => [
      prev[0] + dx * sensitivity,
      Math.max(-90, Math.min(90, prev[1] - dy * sensitivity)),
      prev[2],
    ]);

    setLastMouse(currentMouse);
  };

  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    returnToInitialView();
  }, [returnToInitialView]);

  const handleMouseUp = endDrag;
  const handleMouseLeave = endDrag;

  // Release can happen outside the svg, in another window, or via touch; without this isDragging stays true and auto-rotation never resumes
  useEffect(() => {
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchend", endDrag);
    window.addEventListener("touchcancel", endDrag);
    window.addEventListener("blur", endDrag);
    return () => {
      window.removeEventListener("mouseup", endDrag);
      window.removeEventListener("touchend", endDrag);
      window.removeEventListener("touchcancel", endDrag);
      window.removeEventListener("blur", endDrag);
    };
  }, [endDrag]);

  useEffect(() => {
    if (!svgRef.current || worldData.length === 0 || !isVisible) return;
    if (useResponsive && dimensions.width === 0) return;

    const canvas = earthCanvasRef.current;
    if (canvas && earthRenderer) {
      const { gl } = earthRenderer;
      if (
        gl.isProgram(earthRenderer.program) &&
        gl.isBuffer(earthRenderer.positionBuffer) &&
        gl.isTexture(earthRenderer.texture)
      ) {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const canvasWidth = Math.round(finalWidth * pixelRatio);
        const canvasHeight = Math.round(finalHeight * pixelRatio);
        if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
        }
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(earthRenderer.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, earthRenderer.positionBuffer);
        gl.enableVertexAttribArray(earthRenderer.positionLocation);
        gl.vertexAttribPointer(
          earthRenderer.positionLocation,
          2,
          gl.FLOAT,
          false,
          0,
          0,
        );
        gl.uniform2f(
          earthRenderer.centerLocation,
          canvas.width / 2,
          canvas.height / 2,
        );
        gl.uniform1f(
          earthRenderer.radiusLocation,
          (Math.min(finalWidth, finalHeight) / 2) * scale * 0.9 * pixelRatio,
        );
        gl.uniform3f(
          earthRenderer.rotationLocation,
          (rotation[0] * Math.PI) / 180,
          (rotation[1] * Math.PI) / 180,
          (rotation[2] * Math.PI) / 180,
        );
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, earthRenderer.texture);
        gl.uniform1i(earthRenderer.textureLocation, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    let finalCountryFill = "none";
    let finalStrokeWidth = strokeWidth;
    let finalOpacity = 1.0;
    let renderGraticule = showGraticule;
    let finalGraticuleOpacity = graticuleOpacity;
    let finalSphereOutlineWidth = sphereOutlineWidth;

    if (variant === "wireframe") {
      finalCountryFill = "none";
      finalStrokeWidth = strokeWidth;
      finalOpacity = 1.0;
      renderGraticule = showGraticule;
      finalGraticuleOpacity = graticuleOpacity;
      finalSphereOutlineWidth = sphereOutlineWidth;
    } else if (variant === "wireframesolid") {
      finalCountryFill = "none";
      finalStrokeWidth = strokeWidth;
      finalOpacity = 1.0;
      renderGraticule = false;
      finalGraticuleOpacity = 0;
      finalSphereOutlineWidth = 1.5;
    } else if (variant === "solid") {
      finalCountryFill = defaultCountryFillColor;
      finalStrokeWidth = strokeWidth * 0.5;
      finalOpacity = 0.3;
      renderGraticule = false;
      finalGraticuleOpacity = 0;
      finalSphereOutlineWidth = 1.5;
    }

    if (defaultBackgroundColor !== "transparent") {
      const radius = (Math.min(finalWidth, finalHeight) / 2) * scale * 0.9;
      svg
        .append("circle")
        .attr("cx", finalWidth / 2)
        .attr("cy", finalHeight / 2)
        .attr("r", radius)
        .attr("fill", defaultBackgroundColor);
    }

    let projection: d3.GeoProjection | CustomProjection;
    const path = d3.geoPath();

    if (variant === "wireframe") {
      const t = progress / 100;
      const alpha = Math.pow(t, 0.5);

      const baseScale = Math.min(finalWidth, finalHeight) / 2;
      const scaleRange = d3
        .scaleLinear()
        .domain([0, 1])
        .range([baseScale * 0.9 * scale, baseScale * 0.54 * scale]);
      const baseRotate = d3.scaleLinear().domain([0, 1]).range([0, 0]);

      projection = interpolateProjection(orthographicRaw, equirectangularRaw)
        .scale(scaleRange(alpha))
        .translate([finalWidth / 2, finalHeight / 2])
        .rotate([baseRotate(alpha) + rotation[0], rotation[1], rotation[2]])
        .precision(0.1);

      (projection as CustomProjection).alpha(alpha);
      path.projection(projection);
    } else {
      projection = d3
        .geoOrthographic()
        .scale((Math.min(finalWidth, finalHeight) / 2) * scale * 0.9)
        .translate([finalWidth / 2, finalHeight / 2])
        .rotate([rotation[0], rotation[1], rotation[2]])
        .precision(0.1);

      path.projection(projection);
    }

    if (renderGraticule && finalGraticuleOpacity > 0) {
      try {
        const graticule = d3.geoGraticule();
        const graticulePath = path(graticule());
        if (graticulePath) {
          svg
            .append("path")
            .datum(graticule())
            .attr("d", graticulePath)
            .attr("fill", "none")
            .attr("stroke", defaultGraticuleColor)
            .attr("stroke-width", 1)
            .attr("opacity", finalGraticuleOpacity);
        }
      } catch (error) {
        console.error("Error creating graticule:", error);
      }
    }

    svg
      .selectAll(".country")
      .data(worldData)
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("d", (d: GeoFeature) => {
        try {
          const pathString = path(d as unknown as GeoPermissibleObjects);
          if (!pathString) return "";
          if (
            typeof pathString === "string" &&
            (pathString.includes("NaN") || pathString.includes("Infinity"))
          ) {
            return "";
          }
          return pathString;
        } catch (error) {
          return "";
        }
      })
      .attr("fill", finalCountryFill)
      .attr("stroke", defaultStrokeColor)
      .attr("stroke-width", finalStrokeWidth)
      .attr("opacity", finalOpacity)
      .style("visibility", function (this: SVGPathElement) {
        const pathData = d3.select(this).attr("d");
        return pathData && pathData.length > 0 && !pathData.includes("NaN")
          ? "visible"
          : "hidden";
      })
      .on("mouseenter", function (this: SVGPathElement) {
        if (countryHoverColor && variant === "solid") {
          d3.select(this).attr("fill", countryHoverColor);
        }
      })
      .on("mouseleave", function (this: SVGPathElement) {
        if (variant === "solid") {
          d3.select(this).attr("fill", finalCountryFill);
        }
      });

    try {
      const sphereOutline = path({ type: "Sphere" });
      if (sphereOutline) {
        svg
          .append("path")
          .datum({ type: "Sphere" })
          .attr("d", sphereOutline)
          .attr("fill", "none")
          .attr("stroke", defaultSphereOutlineColor)
          .attr("stroke-width", finalSphereOutlineWidth)
          .attr("opacity", variant === "wireframe" ? 1.0 : 0.8);
      }
    } catch (error) {
      console.error("Error creating sphere outline:", error);
    }

  }, [
    worldData,
    progress,
    rotation,
    isVisible,
    finalWidth,
    finalHeight,
    defaultStrokeColor,
    strokeWidth,
    defaultGraticuleColor,
    graticuleOpacity,
    defaultSphereOutlineColor,
    sphereOutlineWidth,
    showGraticule,
    defaultCountryFillColor,
    countryHoverColor,
    variant,
    scale,
    defaultBackgroundColor,
    useResponsive,
    dimensions.width,
    earthRenderer,
  ]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas
        ref={earthCanvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <svg
        ref={svgRef}
        width={finalWidth}
        height={finalHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "relative z-[1]",
          useResponsive
            ? "w-full h-full opacity-0 transition-opacity duration-1000"
            : "",
        )}
        style={{
          cursor: enableInteraction
            ? isDragging
              ? "grabbing"
              : "grab"
            : "default",
          opacity: useResponsive ? (dimensions.width > 0 ? 1 : 0) : 1,
        }}
      />
    </div>
  );
}

export const FormDots = React.forwardRef<
  React.ComponentRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref,
  ) => {
    const isHorizontal = orientation === "horizontal";
    return (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        className={cn(
          "shrink-0 flex items-center justify-center overflow-hidden",
          isHorizontal ? "w-full" : "h-full",
          className,
        )}
        {...props}
      >
        <div
          className={cn("relative", isHorizontal ? "w-full h-4" : "h-full w-4")}
        >
          <div
            className={cn(
              "absolute inset-0 bg-repeat",
              "text-neutral-400 dark:text-white/20",
            )}
            style={{
              backgroundImage:
                "radial-gradient(circle, currentColor 0.8px, transparent 0.8px)",
              backgroundSize: isHorizontal ? "6px 100%" : "100% 6px",
              maskImage: isHorizontal
                ? "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)"
                : "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
            }}
          />
        </div>
      </SeparatorPrimitive.Root>
    );
  },
);
FormDots.displayName = "FormDots";

interface ContactWithGlobeProps {
  className?: string;
}

export default function ContactWithGlobe({ className }: ContactWithGlobeProps) {
  const [phase, setPhase] = useState<"idle" | "zooming" | "map" | "closing">(
    "idle",
  );

  useEffect(() => {
    if (phase === "idle") return;
    document.body.classList.add("map-open");
    return () => document.body.classList.remove("map-open");
  }, [phase]);

  useEffect(() => {
    if (phase !== "map") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPhase("closing");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[1180px] px-4 py-20 sm:px-6",
        className,
      )}
    >
      <div className="mb-12 flex flex-col items-start gap-4 text-left">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: smoothEase }}
          className="inline-flex items-center rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5"
        >
          <span className="text-sm font-medium text-blue-600">Contact</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.15, ease: smoothEase }}
          className="max-w-3xl text-4xl font-bold text-zinc-900 md:text-5xl"
        >
          Let's Create Something Extraordinary Together.
        </motion.h2>

        <motion.h3
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.22, ease: smoothEase }}
          className="text-xl font-bold text-zinc-900 md:text-2xl"
        >
          Get in Touch
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.3, ease: smoothEase }}
          className="max-w-xl text-base text-zinc-500"
        >
          Have a creative idea, business project, event, or technology
          requirement? Tell us what you're planning, and we'll get back to you
          within one business day.
        </motion.p>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-10 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, delay: 0.2, ease: smoothEase }}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-3">
            {CONTACT_LINKS.map(({ icon: Icon, label, href }, i) => {
              const inner = (
                <>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 transition-all duration-200 group-hover:border-blue-300 group-hover:bg-blue-50">
                    <Icon className="h-3.5 w-3.5 text-zinc-400 transition-colors duration-200 group-hover:text-blue-600" />
                  </div>
                  {label}
                </>
              );
              const cls =
                "group flex w-fit items-center gap-3 text-sm text-zinc-500 transition-colors duration-200 hover:text-zinc-900";
              return (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: 0.3 + i * 0.1,
                    ease: smoothEase,
                  }}
                >
                  {href ? (
                    <a href={href} className={cls}>
                      {inner}
                    </a>
                  ) : (
                    <div className={cls}>{inner}</div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="relative h-52 overflow-hidden">
            <div
              className="absolute left-0 top-1/2 aspect-square w-full"
              style={{ transform: "translateY(calc(-50% + 30px))" }}
            >
              <motion.div
                className="absolute inset-0"
                style={{ transformOrigin: "50% 50%" }}
                animate={
                  phase === "idle"
                    ? { scale: 1, opacity: 1 }
                    : { scale: 6, opacity: 0 }
                }
                transition={
                  phase === "idle"
                    ? { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                    : {
                        scale: { duration: 1.6, ease: [0.5, 0, 0.75, 0] },
                        opacity: { duration: 0.7, delay: 0.9, ease: "easeIn" },
                      }
                }
                onAnimationComplete={() => {
                  if (phase === "zooming") setPhase("map");
                }}
              >
              <GlobeWireframe
                className="absolute inset-0 aspect-square w-full max-w-full text-zinc-700"
                variant="wireframesolid"
                autoRotate
                autoRotateSpeed={0.45}
                autoRotateAxis="center"
                initialRotation={[-85.324, -27.717]}
                returnToInitialRotation
                strokeWidth={0.6}
                graticuleOpacity={0.12}
              />
              <button
                type="button"
                aria-label="View Sorakhutte, Nayabazar, Kathmandu on the map"
                onClick={() => phase === "idle" && setPhase("zooming")}
                className="absolute left-1/2 top-1/2 z-10 cursor-pointer border-0 bg-transparent p-0 outline-none ring-0 focus:outline-none focus-visible:outline-none"
                style={{ transform: "translate(-50%, -50%)" }}
              >
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-full left-1/2 mb-1 whitespace-nowrap                   text-xs font-extrabold text-red-600"
                  style={{ x: "-50%" }}
                  animate={{ opacity: [1, 1, 0, 0] }}
                  transition={{
                    duration: 3,
                    times: [0, 0.66, 0.67, 1],
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  Click on location
                </motion.span>
                <MapPin className="block h-12 w-12 fill-red-600 text-white drop-shadow-md" />
                <span
                  className="absolute left-1/2 top-full mt-1 whitespace-nowrap rounded-md bg-white/95 px-2 py-1 text-xs font-semibold text-blue-700 shadow"
                  style={{ transform: "translateX(-50%)" }}
                >
                  Sorakhutte, Nayabazar
                </span>
              </button>
              </motion.div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#f7f8fa] to-transparent" />
          </div>
          {createPortal(
            <AnimatePresence onExitComplete={() => setPhase("idle")}>
              {(phase === "zooming" || phase === "map") && (
                <motion.div
                  key="map-overlay"
                  className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-3 sm:p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.4, delay: 0.1 } }}
                  transition={{ duration: 0.7, delay: phase === "zooming" ? 0.8 : 0 }}
                  onClick={() => setPhase("closing")}
                >
                  <motion.div
                    className="relative h-[min(90vh,900px)] w-[min(96vw,1900px)] overflow-hidden rounded-2xl bg-white shadow-2xl will-change-transform"
                    initial={{ scale: 1.25, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{
                      scale: 0.96,
                      opacity: 0,
                      transition: { duration: 0.4, ease: "easeIn" },
                    }}
                    transition={{
                      duration: 1.2,
                      delay: 0.8,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <iframe
                      title="Sorakhutte, Nayabazar, Kathmandu"
                      src="https://www.google.com/maps/embed?pb=!4v1793848420312!6m8!1m7!1sbqS1V-Lvas39eWcFMok11Q!2m2!1d27.72020322634663!2d85.30898082059623!3f240.47!4f-0.39000000000000057!5f0.4000000000000002"
                      width="1900"
                      height="900"
                      style={{ border: 0, width: "100%", height: "100%" }}
                      allowFullScreen
                      loading="eager"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </motion.div>
                  <button
                    type="button"
                    aria-label="Close map"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhase("closing");
                    }}
                    className="fixed right-4 top-4 z-[10001] flex h-12 w-12 items-center justify-center rounded-full bg-white text-zinc-900 shadow-lg ring-1 ring-black/10 transition hover:scale-105 hover:bg-zinc-100 sm:right-6 sm:top-6"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body,
          )}
        </motion.div>

        <motion.form
          id="quote-form"
          noValidate
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, delay: 0.35, ease: smoothEase }}
          className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div>
            <h3 className="mb-0.5 text-lg font-semibold text-zinc-900">
              Send a message
            </h3>
            <p className="text-sm text-zinc-500">
              Fill out the form and we'll get back to you promptly.
            </p>
          </div>

          <FormDots />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="fullName" className={LABEL_CLASS}>
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Your name"
                maxLength={120}
                autoComplete="name"
                required
                className={INPUT_CLASS}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className={LABEL_CLASS}>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                maxLength={200}
                autoComplete="email"
                required
                className={INPUT_CLASS}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className={LABEL_CLASS}>
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="98XXXXXXXX"
                maxLength={40}
                className={INPUT_CLASS}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="service" className={LABEL_CLASS}>
                Service
              </label>
              <select
                id="service"
                name="service"
                defaultValue=""
                className={INPUT_CLASS}
              >
                <option value="">Select a service</option>
                {SERVICES.map((service) => (
                  <option key={service}>{service}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="budget" className={LABEL_CLASS}>
              Project budget
            </label>
            <input
              id="budget"
              name="budget"
              type="text"
              placeholder="Optional budget range"
              maxLength={120}
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="message" className={LABEL_CLASS}>
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              maxLength={5000}
              required
              placeholder="Tell us about your project"
              className={cn(INPUT_CLASS, "resize-none")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="contactMethod" className={LABEL_CLASS}>
              Preferred contact method
            </label>
            <select
              id="contactMethod"
              name="contactMethod"
              defaultValue="email"
              className={INPUT_CLASS}
            >
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              className="group inline-flex h-11 items-center gap-2 rounded-xl bg-zinc-900 px-8 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Send Inquiry
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
            <p id="form-status" className="form-status" aria-live="polite" />
          </div>
        </motion.form>
      </div>
    </div>
  );
}
