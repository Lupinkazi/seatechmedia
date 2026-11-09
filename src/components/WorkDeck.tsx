import { useEffect, useState } from "react";
import TumbleDeckShowcase from "./ui/tumble-deck-showcase";
import { getWorkCategory, type WorkCategoryId } from "../data/work-categories";
import {
  getResponsiveWorkImageSrcSet,
  WORK_IMAGE_SIZES,
} from "../lib/work-images";

// Categories with portfolio imagery use the flip deck; IT opens its external project.
const DECK_CATEGORIES: readonly WorkCategoryId[] = [
  "photography",
  "videography",
  "cinematography",
  "marketing",
];

/**
 * WorkDeck listens for both "portfolio-category-change" and
 * "portfolio-subcategory-change" events fired by PortfolioFilters (and by
 * the legacy vanilla-JS path for back-compat).  When a subcategory is
 * selected the deck is filtered to matching items only. Empty selections
 * leave the deck empty so the companion portfolio grid can show its reset state.
 */
export default function WorkDeck() {
  const [categoryId, setCategoryId] = useState(
    () => new URLSearchParams(window.location.search).get("category") ?? "photography",
  );
  const [subcategory, setSubcategory] = useState<string>("All");

  useEffect(() => {
    const onCategory = (event: Event) => {
      const id = (event as CustomEvent<{ categoryId: string }>).detail.categoryId;
      setCategoryId(id);
      // Reset subcategory when category changes via the legacy vanilla path
      setSubcategory("All");
    };
    const onSubcategory = (event: Event) => {
      const detail = (event as CustomEvent<{ categoryId: string; subcategory: string }>).detail;
      setCategoryId(detail.categoryId);
      setSubcategory(detail.subcategory);
    };
    window.addEventListener("portfolio-category-change", onCategory);
    window.addEventListener("portfolio-subcategory-change", onSubcategory);
    return () => {
      window.removeEventListener("portfolio-category-change", onCategory);
      window.removeEventListener("portfolio-subcategory-change", onSubcategory);
    };
  }, []);

  const category = getWorkCategory(categoryId);
  const allItems = category?.portfolioItems ?? [];

  const items =
    subcategory === "All"
      ? allItems
      : allItems.filter(
          (item) => "subcategory" in item && item.subcategory === subcategory,
        );

  if (category?.id === "videography" && items[0] && "externalHref" in items[0]) {
    const item = items[0];
    return (
      <a
        aria-label={`Watch ${item.title} on YouTube (opens in a new tab)`}
        className="it-work-preview video-work-preview"
        href={item.externalHref}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="it-work-preview__image-wrap">
          <img
            alt={item.imageAlt}
            height="360"
            loading="lazy"
            sizes={WORK_IMAGE_SIZES}
            src={item.image}
            srcSet={getResponsiveWorkImageSrcSet(item.image)}
            width="480"
          />
        </span>
        <span className="it-work-preview__copy">
          <span className="it-work-preview__eyebrow">Featured videography</span>
          <strong>{item.title}</strong>
          <span>{item.description}</span>
          <span className="it-work-preview__action">
            Watch on YouTube <span aria-hidden="true">↗</span>
          </span>
        </span>
      </a>
    );
  }

  if (category?.id === "it" && category.externalHref && allItems[0]) {
    return (
      <a
        aria-label={`Open ${allItems[0].title} in a new tab`}
        className="it-work-preview"
        href={category.externalHref}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="it-work-preview__image-wrap">
          <img
            alt={allItems[0].imageAlt}
            height="768"
            loading="lazy"
            sizes={WORK_IMAGE_SIZES}
            src={allItems[0].image}
            srcSet={getResponsiveWorkImageSrcSet(allItems[0].image)}
            width="927"
          />
        </span>
        <span className="it-work-preview__copy">
          <span className="it-work-preview__eyebrow">Featured IT project</span>
          <strong>{allItems[0].title}</strong>
          <span>{allItems[0].description}</span>
          <span className="it-work-preview__action">
            Visit StockWise <span aria-hidden="true">↗</span>
          </span>
        </span>
      </a>
    );
  }

  if (!category || !DECK_CATEGORIES.includes(category.id) || items.length === 0) return null;

  // Key on categoryId + subcategory so the deck remounts (resets position) on
  // every filter change, consistent with the existing per-category remount.
  const deckKey = `${category.id}__${subcategory}`;

  return (
    <TumbleDeckShowcase
      key={deckKey}
      ariaLabel={`${category.label} showcase${subcategory !== "All" ? ` — ${subcategory}` : ""}`}
      cards={items.map((item) => ({
        src: item.image,
        alt: item.imageAlt,
        srcSet: getResponsiveWorkImageSrcSet(item.image),
        sizes: WORK_IMAGE_SIZES,
      }))}
    />
  );
}
