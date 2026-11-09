export type WorkCategoryId =
  | "photography"
  | "videography"
  | "cinematography"
  | "marketing"
  | "it";

// ─── Subcategory configuration ─────────────────────────────────────────────
// Each category with a dropdown lists its subcategory labels here.
// "All <Category>" is always prepended automatically at runtime — do not add it here.

export const PHOTOGRAPHY_SUBCATEGORIES = [
  "Wedding",
  "Bartabanda",
  "Pasni",
  "Puran",
  "Birthday",
  "Engagement",
] as const;

export const VIDEOGRAPHY_SUBCATEGORIES = [
  "Marriage",
  "Puran",
] as const;

export const CINEMATOGRAPHY_SUBCATEGORIES = [
  "Wedding Cinematography",
  "Pre-Wedding Films",
  "Bartabanda Cinematography",
  "Pasni Cinematography",
  "Puran",
] as const;

export const MARKETING_SUBCATEGORIES = [
  "Brand Promotion",
  "Product Promotion",
  "Event Promotion",
  "Digital Advertising",
  "Promotional Photography",
] as const;

/** Map from category id to its subcategory list (undefined = no dropdown). */
export const CATEGORY_SUBCATEGORIES: Partial<Record<WorkCategoryId, readonly string[]>> = {
  photography: PHOTOGRAPHY_SUBCATEGORIES,
  cinematography: CINEMATOGRAPHY_SUBCATEGORIES,
  marketing: MARKETING_SUBCATEGORIES,
};

// ─── Portfolio item types ───────────────────────────────────────────────────

export interface PortfolioWorkItem {
  id: number;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  /** Optional link to the project on an external platform. */
  externalHref?: string;
  /** Subcategory label — must match one of the entries in the category's subcategory list. */
  subcategory?: string;
  /** Optional shoot location within Nepal. */
  location?: string;
  /** Optional year the project was completed. */
  year?: number;
  /** Image source type. */
  source?: "original" | "licensed" | "generated";
}

export interface WorkCategory {
  id: WorkCategoryId;
  label: string;
  shortDescription: string;
  folderImage: string;
  externalHref?: string;
  portfolioItems: readonly PortfolioWorkItem[];
  workSectionTarget: "#portfolio";
}

// ─── Portfolio data ─────────────────────────────────────────────────────────
// Rules:
//   • Every item id is globally unique.
//   • Every item image path is globally unique — no image appears twice.
//   • Each item belongs to exactly one category and one subcategory.

export const WORK_CATEGORIES = [
  {
    id: "photography",
    label: "Photography",
    shortDescription: "Still images shaped by light, detail, and a clear point of view.",
    folderImage: "/images/about/photography-phewa.jpg",
    workSectionTarget: "#portfolio",
    portfolioItems: [
      {
        id: 101,
        title: "Kathmandu Valley Wedding (Concept)",
        description: "AI-generated concept photograph inspired by a traditional courtyard wedding in the Kathmandu Valley.",
        image: "/images/work/photography-wedding-kathmandu.jpg",
        imageAlt: "Nepali bride and groom during a courtyard wedding ceremony in the Kathmandu Valley",
        subcategory: "Wedding",
        location: "Kathmandu Valley",
        source: "generated",
      },
      {
        id: 102,
        title: "Ilam Bartabanda (Concept)",
        description: "AI-generated concept photograph of a family gathered for a Bartabanda ceremony in eastern Nepal.",
        image: "/images/work/photography-bartabanda-ilam.jpg",
        imageAlt: "Family gathered around a boy during a Bartabanda ceremony in Ilam",
        subcategory: "Bartabanda",
        location: "Ilam",
        source: "generated",
      },
      {
        id: 103,
        title: "Chitwan Pasni (Concept)",
        description: "AI-generated concept photograph of a family celebrating a baby's first rice-feeding ceremony.",
        image: "/images/work/photography-pasni-chitwan.jpg",
        imageAlt: "Family celebrating a baby's Pasni rice-feeding ceremony in Chitwan",
        subcategory: "Pasni",
        location: "Chitwan",
        source: "generated",
      },
      {
        id: 104,
        title: "Janakpur Puran Recitation (Concept)",
        description: "AI-generated concept photograph of a family listening to a Puran recitation in Janakpur.",
        image: "/images/work/photography-puran-janakpur.jpg",
        imageAlt: "A priest reading scripture to a family during a Puran gathering in Janakpur",
        subcategory: "Puran",
        location: "Janakpur",
        source: "generated",
      },
      {
        id: 105,
        title: "Tansen Birthday Gathering (Concept)",
        description: "AI-generated concept photograph of a family celebrating a child's birthday in Tansen.",
        image: "/images/work/photography-birthday-tansen.jpg",
        imageAlt: "Family celebrating a child's birthday on a terrace in Tansen",
        subcategory: "Birthday",
        location: "Tansen",
        source: "generated",
      },
      {
        id: 106,
        title: "Pokhara Engagement (Concept)",
        description: "AI-generated concept photograph of a couple celebrating their engagement beside Phewa Lake.",
        image: "/images/work/photography-engagement-pokhara.jpg",
        imageAlt: "Nepali couple exchanging rings at an engagement gathering beside Phewa Lake",
        subcategory: "Engagement",
        location: "Pokhara",
        source: "generated",
      },
      {
        id: 107,
        title: "Bhaktapur Wedding (Concept)",
        description: "AI-generated concept photograph of a wedding garland exchange in Bhaktapur.",
        image: "/images/work/photography-wedding-bhaktapur.jpg",
        imageAlt: "Bride and groom exchanging garlands in a Bhaktapur courtyard",
        subcategory: "Wedding",
        location: "Bhaktapur",
        source: "generated",
      },
      {
        id: 108,
        title: "Dharan Wedding (Concept)",
        description: "AI-generated concept photograph of a family wedding celebration in Dharan.",
        image: "/images/work/photography-wedding-dharan.jpg",
        imageAlt: "A newly married couple celebrating with family in a Dharan garden",
        subcategory: "Wedding",
        location: "Dharan",
        source: "generated",
      },
      {
        id: 109,
        title: "Pokhara Bartabanda (Concept)",
        description: "AI-generated concept photograph of a sacred-thread ceremony in Pokhara.",
        image: "/images/work/photography-bartabanda-pokhara.jpg",
        imageAlt: "A boy and his family at a Bartabanda ceremony in Pokhara",
        subcategory: "Bartabanda",
        location: "Pokhara",
        source: "generated",
      },
      {
        id: 110,
        title: "Lalitpur Bartabanda (Concept)",
        description: "AI-generated concept photograph of a Bartabanda ceremony at a family home in Lalitpur.",
        image: "/images/work/photography-bartabanda-lalitpur.jpg",
        imageAlt: "A family gathered for a boy's Bartabanda ceremony in Lalitpur",
        subcategory: "Bartabanda",
        location: "Lalitpur",
        source: "generated",
      },
      {
        id: 111,
        title: "Bhaktapur Pasni (Concept)",
        description: "AI-generated concept photograph of a baby's rice-feeding celebration in Bhaktapur.",
        image: "/images/work/photography-pasni-bhaktapur.jpg",
        imageAlt: "A family feeding a baby during a Pasni celebration in Bhaktapur",
        subcategory: "Pasni",
        location: "Bhaktapur",
        source: "generated",
      },
      {
        id: 112,
        title: "Pokhara Pasni (Concept)",
        description: "AI-generated concept photograph of a family rice-feeding ceremony in Pokhara.",
        image: "/images/work/photography-pasni-pokhara.jpg",
        imageAlt: "A baby being fed rice by a family member during a Pasni in Pokhara",
        subcategory: "Pasni",
        location: "Pokhara",
        source: "generated",
      },
      {
        id: 113,
        title: "Pokhara Puran (Concept)",
        description: "AI-generated concept photograph of a Puran recitation in a Pokhara courtyard.",
        image: "/images/work/photography-puran-pokhara.jpg",
        imageAlt: "A family listening to a priest reading scripture at a Puran gathering in Pokhara",
        subcategory: "Puran",
        location: "Pokhara",
        source: "generated",
      },
      {
        id: 114,
        title: "Banepa Puran (Concept)",
        description: "AI-generated concept photograph of a family attending a Puran reading in Banepa.",
        image: "/images/work/photography-puran-banepa.jpg",
        imageAlt: "A priest reading scripture to a family at home in Banepa",
        subcategory: "Puran",
        location: "Banepa",
        source: "generated",
      },
      {
        id: 115,
        title: "Chitwan Birthday (Concept)",
        description: "AI-generated concept photograph of a child's garden birthday celebration in Chitwan.",
        image: "/images/work/photography-birthday-chitwan.jpg",
        imageAlt: "A child cutting a birthday cake with family in a Chitwan garden",
        subcategory: "Birthday",
        location: "Chitwan",
        source: "generated",
      },
      {
        id: 116,
        title: "Lalitpur Birthday (Concept)",
        description: "AI-generated concept photograph of a family celebrating a grandmother's birthday in Lalitpur.",
        image: "/images/work/photography-birthday-lalitpur.jpg",
        imageAlt: "A grandmother blowing out birthday candles with her family in Lalitpur",
        subcategory: "Birthday",
        location: "Lalitpur",
        source: "generated",
      },
      {
        id: 117,
        title: "Patan Engagement (Concept)",
        description: "AI-generated concept photograph of an engagement celebration in a Patan courtyard.",
        image: "/images/work/photography-engagement-patan.jpg",
        imageAlt: "A couple exchanging garlands at an engagement celebration in Patan",
        subcategory: "Engagement",
        location: "Patan",
        source: "generated",
      },
      {
        id: 118,
        title: "Bandipur Engagement (Concept)",
        description: "AI-generated concept photograph of a family engagement celebration in Bandipur.",
        image: "/images/work/photography-engagement-bandipur.jpg",
        imageAlt: "A couple celebrating their engagement with family in Bandipur",
        subcategory: "Engagement",
        location: "Bandipur",
        source: "generated",
      },
    ],
  },
  {
    id: "videography",
    label: "Videography",
    shortDescription: "Video production that brings ideas to life through motion and story.",
    folderImage: "/images/about/videography-village.jpg",
    workSectionTarget: "#portfolio",
    portfolioItems: [
      {
        id: 401,
        title: "Featured video",
        description: "Watch our videography work on YouTube.",
        image: "https://i.ytimg.com/vi/LEO4wQgYVSI/hqdefault.jpg",
        imageAlt: "Thumbnail for SeaTech Media's featured video on YouTube",
        externalHref: "https://youtu.be/LEO4wQgYVSI?si=EfhE22bAWCSo4L8k",
        source: "original",
      },
    ],
  },
  {
    id: "cinematography",
    label: "Cinematography",
    shortDescription: "Composed moving images with considered light, framing, and pace.",
    folderImage: "/images/about/cinematography-ilam.jpg",
    workSectionTarget: "#portfolio",
    portfolioItems: [
      {
        id: 201,
        title: "Swayambhunath Shoot",
        description: "Handheld cinema camera on the temple steps.",
        image: "/images/work/cinematography-1.jpg",
        imageAlt: "Cinematographer filming at Swayambhunath in Kathmandu",
        subcategory: "Event Cinematography",
        location: "Kathmandu",
        source: "original",
      },
      {
        id: 202,
        title: "Bhaktapur Alley",
        description: "A small crew shooting in the old brick lanes.",
        image: "/images/work/cinematography-2.jpg",
        imageAlt: "Film crew with slider and boom mic in a Bhaktapur alley",
        subcategory: "Documentary Films",
        location: "Bhaktapur",
        source: "original",
      },
      {
        id: 203,
        title: "Langtang Morning",
        description: "Pulling focus on the Himalayas at first light.",
        image: "/images/work/cinematography-3.jpg",
        imageAlt: "Cinema camera and monitor framing snow peaks near Langtang",
        subcategory: "Documentary Films",
        location: "Langtang",
        source: "original",
      },
      {
        id: 204,
        title: "Terrace Golden Hour",
        description: "Gimbal work over terraced fields at sunset.",
        image: "/images/work/cinematography-4.jpg",
        imageAlt: "Camera operator filming a farmer on terraced hills in Nepal",
        subcategory: "Commercial Films",
        location: "Pokhara",
        source: "original",
      },
      {
        id: 205,
        title: "Thamel by Night",
        description: "Lighting a narrow street for a night scene.",
        image: "/images/work/cinematography-5.jpg",
        imageAlt: "Film crew lighting a night shoot in Thamel, Kathmandu",
        subcategory: "Commercial Films",
        location: "Kathmandu",
        source: "original",
      },
      {
        id: 206,
        title: "Bhaktapur Film Scene (Concept)",
        description: "AI-generated concept image for a cinematic scene in Bhaktapur.",
        image: "/images/work/nepal-cinematography-bhaktapur-concept.png",
        imageAlt: "Cinematographer filming a stone lane in Bhaktapur at blue hour",
        subcategory: "Documentary Films",
        location: "Bhaktapur",
        source: "generated",
      },
      {
        id: 207,
        title: "Bhaktapur Wedding Film (Concept)",
        description: "AI-generated concept image of a wedding film shoot in a Bhaktapur courtyard.",
        image: "/images/work/cinema-wedding-bhaktapur.jpg",
        imageAlt: "Cinematographer filming a Nepali wedding in a Bhaktapur courtyard",
        subcategory: "Wedding Cinematography",
        location: "Bhaktapur",
        source: "generated",
      },
      {
        id: 208,
        title: "Pokhara Wedding Film (Concept)",
        description: "AI-generated concept image of a garden wedding film shoot in Pokhara.",
        image: "/images/work/cinema-wedding-pokhara.jpg",
        imageAlt: "Filmmaker recording a wedding celebration in a Pokhara garden",
        subcategory: "Wedding Cinematography",
        location: "Pokhara",
        source: "generated",
      },
      {
        id: 209,
        title: "Phewa Lake Pre-Wedding Film (Concept)",
        description: "AI-generated concept image of a pre-wedding film shoot beside Phewa Lake.",
        image: "/images/work/cinema-prewedding-pokhara.jpg",
        imageAlt: "Filmmaker recording a couple beside Phewa Lake in Pokhara",
        subcategory: "Pre-Wedding Films",
        location: "Pokhara",
        source: "generated",
      },
      {
        id: 210,
        title: "Bandipur Pre-Wedding Film (Concept)",
        description: "AI-generated concept image of a couple being filmed in Bandipur.",
        image: "/images/work/cinema-prewedding-bandipur.jpg",
        imageAlt: "Filmmaker recording a couple walking in a traditional Bandipur street",
        subcategory: "Pre-Wedding Films",
        location: "Bandipur",
        source: "generated",
      },
      {
        id: 211,
        title: "Ilam Bartabanda Film (Concept)",
        description: "AI-generated concept image of a Bartabanda film shoot in Ilam.",
        image: "/images/work/cinema-bartabanda-ilam.jpg",
        imageAlt: "Cinematographer filming a Bartabanda ceremony in an Ilam courtyard",
        subcategory: "Bartabanda Cinematography",
        location: "Ilam",
        source: "generated",
      },
      {
        id: 212,
        title: "Lalitpur Bartabanda Film (Concept)",
        description: "AI-generated concept image of a family Bartabanda ceremony being filmed in Lalitpur.",
        image: "/images/work/cinema-bartabanda-lalitpur.jpg",
        imageAlt: "Filmmaker recording a Bartabanda ceremony at a family home in Lalitpur",
        subcategory: "Bartabanda Cinematography",
        location: "Lalitpur",
        source: "generated",
      },
      {
        id: 213,
        title: "Chitwan Pasni Film (Concept)",
        description: "AI-generated concept image of a Pasni ceremony being filmed in Chitwan.",
        image: "/images/work/cinema-pasni-chitwan.jpg",
        imageAlt: "Cinematographer filming a baby's rice-feeding celebration in Chitwan",
        subcategory: "Pasni Cinematography",
        location: "Chitwan",
        source: "generated",
      },
      {
        id: 214,
        title: "Bhaktapur Pasni Film (Concept)",
        description: "AI-generated concept image of a Pasni film shoot in a Bhaktapur courtyard.",
        image: "/images/work/cinema-pasni-bhaktapur.jpg",
        imageAlt: "Filmmaker recording a family rice-feeding ceremony in Bhaktapur",
        subcategory: "Pasni Cinematography",
        location: "Bhaktapur",
        source: "generated",
      },
      {
        id: 215,
        title: "Janakpur Puran Film (Concept)",
        description: "AI-generated concept image of a Puran recitation being filmed in Janakpur.",
        image: "/images/work/cinema-puran-janakpur.jpg",
        imageAlt: "Cinematographer recording a Puran gathering in Janakpur",
        subcategory: "Puran",
        location: "Janakpur",
        source: "generated",
      },
      {
        id: 216,
        title: "Banepa Puran Film (Concept)",
        description: "AI-generated concept image of a family Puran reading being filmed in Banepa.",
        image: "/images/work/cinema-puran-banepa.jpg",
        imageAlt: "Filmmaker recording a priest reading scripture to a family in Banepa",
        subcategory: "Puran",
        location: "Banepa",
        source: "generated",
      },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    shortDescription: "Digital communication and campaigns made for the right audience.",
    folderImage: "/images/about/marketing-nepal.jpg",
    workSectionTarget: "#portfolio",
    portfolioItems: [
      {
        id: 301,
        title: "Local Brand Story",
        description: "Shooting social content for a Thamel singing bowl shop.",
        image: "/images/work/marketing-1.jpg",
        imageAlt: "Shopkeeper filming a singing bowl for social media in Thamel",
        subcategory: "Brand Promotion",
        location: "Kathmandu",
        source: "original",
      },
      {
        id: 302,
        title: "Campaign Planning",
        description: "The team mapping a campaign on the whiteboard.",
        image: "/images/work/marketing-2.jpg",
        imageAlt: "Marketing team planning a campaign in a Kathmandu office",
        subcategory: "Social Media Campaigns",
        location: "Kathmandu",
        source: "original",
      },
      {
        id: 303,
        title: "Outdoor Advertising",
        description: "Billboard presence on a busy Kathmandu road.",
        image: "/images/work/marketing-3.jpg",
        imageAlt: "Billboard above traffic near Ratna Park in Kathmandu",
        subcategory: "Digital Advertising",
        location: "Kathmandu",
        source: "original",
      },
      {
        id: 304,
        title: "Analytics Review",
        description: "Reading engagement numbers over milk tea and momos.",
        image: "/images/work/marketing-4.jpg",
        imageAlt: "Woman reviewing social media analytics in a Kathmandu cafe",
        subcategory: "Corporate Marketing",
        location: "Kathmandu",
        source: "original",
      },
      {
        id: 305,
        title: "Kathmandu Craft Campaign (Concept)",
        description: "AI-generated concept image for a campaign built around Nepali craft.",
        image: "/images/work/nepal-marketing-kathmandu-concept.png",
        imageAlt: "Kathmandu creative team planning a campaign with a local craft entrepreneur",
        subcategory: "Brand Promotion",
        location: "Kathmandu",
        source: "generated",
      },
      {
        id: 306,
        title: "Patan Textile Brand Story (Concept)",
        description: "AI-generated concept image of a brand story being filmed in a Patan textile studio.",
        image: "/images/work/marketing-brand-patan.jpg",
        imageAlt: "Creative team interviewing a textile maker in a Patan weaving studio",
        subcategory: "Brand Promotion",
        location: "Patan",
        source: "generated",
      },
      {
        id: 307,
        title: "Ilam Tea Brand Story (Concept)",
        description: "AI-generated concept image of a creative team filming a tea grower's story in Ilam.",
        image: "/images/work/marketing-brand-ilam.jpg",
        imageAlt: "Creative team filming a tea grower in the hills of Ilam",
        subcategory: "Brand Promotion",
        location: "Ilam",
        source: "generated",
      },
      {
        id: 308,
        title: "Bhaktapur Pottery Promotion (Concept)",
        description: "AI-generated concept image of a pottery product shoot in Bhaktapur.",
        image: "/images/work/marketing-product-bhaktapur.jpg",
        imageAlt: "Photographer capturing handmade pottery in a Bhaktapur workshop",
        subcategory: "Product Promotion",
        location: "Bhaktapur",
        source: "generated",
      },
      {
        id: 309,
        title: "Dhankuta Tea Product Shoot (Concept)",
        description: "AI-generated concept image of a tea product shoot in Dhankuta.",
        image: "/images/work/marketing-product-dhankuta.jpg",
        imageAlt: "Photographer capturing tea products near a window in Dhankuta",
        subcategory: "Product Promotion",
        location: "Dhankuta",
        source: "generated",
      },
      {
        id: 310,
        title: "Pokhara Community Event (Concept)",
        description: "AI-generated concept image of a music and crafts event being prepared in Pokhara.",
        image: "/images/work/marketing-event-pokhara.jpg",
        imageAlt: "Photographer documenting preparations for a lakeside community event in Pokhara",
        subcategory: "Event Promotion",
        location: "Pokhara",
        source: "generated",
      },
      {
        id: 311,
        title: "Janakpur Craft Event (Concept)",
        description: "AI-generated concept image of a creative team documenting a crafts event in Janakpur.",
        image: "/images/work/marketing-event-janakpur.jpg",
        imageAlt: "Filmmaker recording a community craft event in a Janakpur courtyard",
        subcategory: "Event Promotion",
        location: "Janakpur",
        source: "generated",
      },
      {
        id: 312,
        title: "Bharatpur Digital Campaign (Concept)",
        description: "AI-generated concept image of a digital advertising team at work in Bharatpur.",
        image: "/images/work/marketing-digital-bharatpur.jpg",
        imageAlt: "Two marketers discussing a digital campaign in a Bharatpur office",
        subcategory: "Digital Advertising",
        location: "Bharatpur",
        source: "generated",
      },
      {
        id: 313,
        title: "Bandipur Cafe Campaign (Concept)",
        description: "AI-generated concept image of a cafe owner and marketer planning an advertisement in Bandipur.",
        image: "/images/work/marketing-digital-bandipur.jpg",
        imageAlt: "Cafe owner and marketer planning a digital advertisement in Bandipur",
        subcategory: "Digital Advertising",
        location: "Bandipur",
        source: "generated",
      },
      {
        id: 314,
        title: "Dharan Market Photography (Concept)",
        description: "AI-generated concept image of promotional photography at a Dharan market.",
        image: "/images/work/marketing-photo-dharan.jpg",
        imageAlt: "Photographer capturing a fruit seller at a market in Dharan",
        subcategory: "Promotional Photography",
        location: "Dharan",
        source: "generated",
      },
      {
        id: 315,
        title: "Tansen Textile Photography (Concept)",
        description: "AI-generated concept image of a promotional textile shoot in Tansen.",
        image: "/images/work/marketing-photo-tansen.jpg",
        imageAlt: "Photographer capturing a textile maker in a Tansen workshop",
        subcategory: "Promotional Photography",
        location: "Tansen",
        source: "generated",
      },
    ],
  },
  {
    id: "it",
    label: "IT",
    shortDescription: "StockWise inventory and cash-movement tools for growing businesses in Nepal.",
    folderImage: "/images/work/it-stockwise-shop.jpg",
    externalHref: "https://stockwise-nepal-omega.vercel.app/",
    workSectionTarget: "#portfolio",
    portfolioItems: [
      {
        id: 501,
        title: "StockWise — inventory tools for Nepali businesses",
        description: "Track sales, purchases, expiry dates, and cash movement with StockWise.",
        image: "/images/work/it-stockwise-shop.jpg",
        imageAlt: "Screenshot of the StockWise Nepal homepage and its inventory management message",
        source: "original",
      },
    ],
  },
] as const satisfies readonly WorkCategory[];

export function getWorkCategory(id: string | null | undefined) {
  return WORK_CATEGORIES.find((category) => category.id === id);
}

export function getWorkCategoryHref(category: WorkCategory) {
  return category.externalHref ?? `?category=${category.id}${category.workSectionTarget}`;
}

// ─── Duplicate-image validation (development only) ──────────────────────────
// Runs once in development to catch accidental image path reuse across items.
if (import.meta.env.DEV) {
  const seenImages = new Set<string>();
  const seenIds = new Set<number>();
  for (const category of WORK_CATEGORIES) {
    for (const item of category.portfolioItems) {
      if (seenIds.has(item.id)) {
        console.error(`[portfolio] Duplicate item id: ${item.id} (category: ${category.id})`);
      }
      seenIds.add(item.id);
      if (seenImages.has(item.image)) {
        console.error(`[portfolio] Duplicate image path: ${item.image} (id: ${item.id})`);
      }
      seenImages.add(item.image);
    }
  }
}
