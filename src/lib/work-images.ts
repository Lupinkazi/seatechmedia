const RESPONSIVE_WIDTHS = [480, 960] as const;

export const WORK_IMAGE_SIZES =
  "(max-width: 899px) calc(100vw - 32px), 560px";

export const PORTFOLIO_GRID_IMAGE_SIZES =
  "(max-width: 767px) calc(100vw - 32px), (max-width: 1023px) calc((100vw - 54px) / 2), 378px";

export function getResponsiveWorkImageSrcSet(
  image: string,
): string | undefined {
  if (!image.startsWith("/images/work/")) return undefined;

  const imageBase = image.replace(/\.(?:jpe?g|png|webp)$/i, "");
  if (imageBase === image) return undefined;

  return RESPONSIVE_WIDTHS.map(
    (width) => `${imageBase}-${width}w.jpg ${width}w`,
  ).join(", ");
}
