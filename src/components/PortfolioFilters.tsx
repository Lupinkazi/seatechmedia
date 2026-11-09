import { useCallback, useEffect, useRef, useState } from "react";
import { Check, SlidersHorizontal } from "lucide-react";
import {
  CATEGORY_SUBCATEGORIES,
  WORK_CATEGORIES,
  type WorkCategoryId,
} from "../data/work-categories";

function dispatchCategoryChange(categoryId: WorkCategoryId) {
  window.dispatchEvent(
    new CustomEvent("portfolio-category-change", {
      detail: { categoryId },
    }),
  );
}

function dispatchSubcategoryChange(
  categoryId: WorkCategoryId,
  subcategory: string,
) {
  window.dispatchEvent(
    new CustomEvent("portfolio-subcategory-change", {
      detail: { categoryId, subcategory },
    }),
  );
}

interface CategoryPillProps {
  id: WorkCategoryId;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function CategoryPill({ id, label, isActive, onClick }: CategoryPillProps) {
  return (
    <button
      type="button"
      className={["pf-pill", isActive ? "pf-pill--active" : ""]
        .filter(Boolean)
        .join(" ")}
      data-category-id={id}
      aria-pressed={isActive}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

interface SubcategoryFilterPanelProps {
  categoryId: WorkCategoryId;
  selectedSubcategory: string;
  onSelect: (subcategory: string) => void;
}

function SubcategoryFilterPanel({
  categoryId,
  selectedSubcategory,
  onSelect,
}: SubcategoryFilterPanelProps) {
  const category = WORK_CATEGORIES.find((item) => item.id === categoryId);
  if (!category) return null;

  const subcategories = CATEGORY_SUBCATEGORIES[categoryId];
  const options = subcategories
    ? [`All ${category.label}`, ...subcategories]
    : [];

  return (
    <fieldset className="pf-filter-panel">
      <legend className="sr-only">{category.label} filters</legend>
      <div className="pf-filter-panel__heading">{category.label} filters</div>
      {options.length > 0 ? (
        <div className="pf-filter-panel__options">
          {options.map((label) => {
            const value = label === `All ${category.label}` ? "All" : label;
            const isSelected = selectedSubcategory === value;
            return (
              <label
                className={[
                  "pf-filter-option",
                  isSelected ? "pf-filter-option--selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={`${categoryId}-${label}`}
              >
                <input
                  type="radio"
                  name={`portfolio-subcategory-${categoryId}`}
                  value={value}
                  checked={isSelected}
                  onChange={() => onSelect(value)}
                />
                <span className="pf-filter-option__label">{label}</span>
                {isSelected && (
                  <Check
                    className="pf-filter-option__check"
                    size={15}
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                )}
              </label>
            );
          })}
        </div>
      ) : (
        <p className="pf-filter-panel__empty">
          IT projects do not have subcategory filters.
        </p>
      )}
    </fieldset>
  );
}

export default function PortfolioFilters() {
  const filterLayoutRef = useRef<HTMLDivElement>(null);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<WorkCategoryId>(() => {
    const requestedCategory = new URLSearchParams(window.location.search).get(
      "category",
    );
    return (
      WORK_CATEGORIES.find((category) => category.id === requestedCategory)?.id ??
      WORK_CATEGORIES[0].id
    );
  });

  const [subcategoryMap, setSubcategoryMap] = useState<Record<string, string>>(
    () => Object.fromEntries(WORK_CATEGORIES.map((category) => [category.id, "All"])),
  );

  const updateUrl = useCallback((categoryId: WorkCategoryId) => {
    const url = new URL(window.location.href);
    url.searchParams.set("category", categoryId);
    url.hash = "portfolio";
    window.history.pushState({ portfolioCategory: categoryId }, "", url);
  }, []);

  const handleCategoryClick = useCallback(
    (categoryId: WorkCategoryId) => {
      setIsFilterOpen(false);
      setActiveCategory(categoryId);
      setSubcategoryMap((previous) => ({ ...previous, [categoryId]: "All" }));
      dispatchCategoryChange(categoryId);
      dispatchSubcategoryChange(categoryId, "All");
      updateUrl(categoryId);
    },
    [updateUrl],
  );

  const hasSubcategoryFilters = Boolean(
    CATEGORY_SUBCATEGORIES[activeCategory]?.length,
  );

  const handleSubcategorySelect = useCallback(
    (categoryId: WorkCategoryId, subcategory: string) => {
      setActiveCategory(categoryId);
      setSubcategoryMap((previous) => ({
        ...previous,
        [categoryId]: subcategory,
      }));
      dispatchCategoryChange(categoryId);
      dispatchSubcategoryChange(categoryId, subcategory);
      updateUrl(categoryId);
    },
    [updateUrl],
  );

  useEffect(() => {
    function onPopState() {
      const requestedCategory = new URLSearchParams(window.location.search).get(
        "category",
      );
      const categoryId =
        WORK_CATEGORIES.find((category) => category.id === requestedCategory)?.id ??
        WORK_CATEGORIES[0].id;
      setIsFilterOpen(false);
      setActiveCategory(categoryId);
      setSubcategoryMap((previous) => ({
        ...previous,
        [categoryId]: "All",
      }));
      dispatchCategoryChange(categoryId);
      dispatchSubcategoryChange(categoryId, "All");
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!isFilterOpen) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !filterLayoutRef.current?.contains(event.target)
      ) {
        setIsFilterOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsFilterOpen(false);
        filterTriggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isFilterOpen]);

  useEffect(() => {
    const subcategory = subcategoryMap[activeCategory] ?? "All";
    dispatchCategoryChange(activeCategory);
    dispatchSubcategoryChange(activeCategory, subcategory);
    // The initial filter is dispatched once when the component mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pf-filter-layout" ref={filterLayoutRef}>
      <div className="pf-filter-toolbar">
        <div className="pf-category-list" role="group" aria-label="Portfolio categories">
          {WORK_CATEGORIES.map((category) => (
            <CategoryPill
              key={category.id}
              id={category.id}
              label={category.label}
              isActive={activeCategory === category.id}
              onClick={() => handleCategoryClick(category.id)}
            />
          ))}
        </div>
        {hasSubcategoryFilters && (
          <button
            ref={filterTriggerRef}
            type="button"
            className={[
              "pf-filter-toggle",
              isFilterOpen ? "pf-filter-toggle--open" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={`${isFilterOpen ? "Close" : "Open"} ${WORK_CATEGORIES.find((category) => category.id === activeCategory)?.label ?? "portfolio"} filters`}
            aria-expanded={isFilterOpen}
            aria-controls="portfolio-filter-options"
            onClick={() => setIsFilterOpen((open) => !open)}
          >
            <SlidersHorizontal size={17} aria-hidden="true" />
            <span>Filters</span>
            {subcategoryMap[activeCategory] !== "All" && (
              <span className="pf-filter-toggle__count" aria-label="1 active filter">
                1
              </span>
            )}
          </button>
        )}
      </div>
      {isFilterOpen && hasSubcategoryFilters && (
        <div id="portfolio-filter-options">
          <SubcategoryFilterPanel
            categoryId={activeCategory}
            selectedSubcategory={subcategoryMap[activeCategory] ?? "All"}
            onSelect={(subcategory) =>
              handleSubcategorySelect(activeCategory, subcategory)
            }
          />
        </div>
      )}
    </div>
  );
}
