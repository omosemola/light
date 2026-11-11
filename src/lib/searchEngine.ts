import {
  normalizeCategorySlug,
  getCategoryAliases,
  getMajorCategoryBySlug,
} from "./categories";

/**
 * Shared marketplace search engine.
 *
 * Used by BOTH the server action (`searchLiveCatalog`) to build the database query and by the
 * search page client to rank results, so tokenisation, synonyms and relevance stay consistent.
 * This module is intentionally framework-free (no "use server"/"use client").
 */

/* ───────────────────────────── Normalisation ───────────────────────────── */

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "of", "for", "with", "in", "on", "to", "at", "by",
  "i", "me", "my", "want", "need", "some", "any", "buy", "get", "find", "please", "pls",
]);

/** Lowercases, strips accents/diacritics and replaces punctuation/emoji with spaces. */
export function normalizeText(value?: string | null): string {
  if (!value) return "";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Splits a query into meaningful tokens (stopwords removed unless that would empty the query). */
export function tokenizeQuery(query?: string | null): string[] {
  const words = normalizeText(query).split(" ").filter(Boolean);
  const meaningful = words.filter((w) => !STOPWORDS.has(w));
  const tokens = meaningful.length > 0 ? meaningful : words;
  return Array.from(new Set(tokens)).slice(0, 8);
}

/**
 * Matches a stem against a single word.
 * Short stems (≤ 3 chars, e.g. "car", "pen", "oud") must match the whole word (or its plural)
 * so that "car" never matches "care"/"cargo" and "pen" never matches "pencil case" by accident.
 */
function wordMatchesStem(word: string, stem: string): boolean {
  if (stem.length <= 3) return word === stem || word === `${stem}s`;
  return word.startsWith(stem);
}

/** True when any word in `text` matches the stem (multi-word stems match as a phrase). */
export function textHasStem(text: string, stem: string): boolean {
  const normalized = normalizeText(text);
  if (!normalized) return false;
  const cleanStem = normalizeText(stem);
  if (!cleanStem) return false;
  if (cleanStem.includes(" ")) return normalized.includes(cleanStem);
  return normalized.split(" ").some((w) => wordMatchesStem(w, cleanStem));
}

/* ───────────────────────────── Synonyms ───────────────────────────── */

interface SynonymGroup {
  /** Query stems that activate this group. */
  triggers: string[];
  /** Database Category ids that belong to this group. */
  categoryIds: string[];
  /** Stems matched against category / store-category text. */
  categoryKeywords: string[];
}

/**
 * Generic intent words mapped to campus categories (e.g. "perfume" → Fragrances).
 * Specific item names are deliberately NOT triggers, so a search for "cake" ranks cakes first
 * instead of flooding results with every pastry.
 */
const SYNONYM_GROUPS: SynonymGroup[] = [
  {
    triggers: ["food", "foods", "meal", "eat", "lunch", "dinner", "breakfast", "kitchen", "restaurant", "cafeteria"],
    categoryIds: ["food", "campus-food-meals", "cafeteria-snacks-combos"],
    categoryKeywords: ["food", "meal", "cafeteria"],
  },
  {
    triggers: ["pastr", "bakery", "baked", "dessert", "confection"],
    categoryIds: ["pastries"],
    categoryKeywords: ["pastr", "bakery"],
  },
  {
    triggers: ["snack", "chop", "chops", "munch"],
    categoryIds: ["snacks", "pastries", "cafeteria-snacks-combos"],
    categoryKeywords: ["snack", "pastr"],
  },
  {
    triggers: ["drink", "beverage", "juice", "water", "zobo", "smoothie", "yoghurt", "yogurt", "soda", "milkshake"],
    categoryIds: ["drinks"],
    categoryKeywords: ["drink", "beverage"],
  },
  {
    triggers: ["cloth", "wear", "fashion", "outfit", "apparel", "attire", "merch", "thrift"],
    categoryIds: ["wears", "fashion-wears-campus-merch", "sports-wears", "accessories", "jewelries"],
    categoryKeywords: ["wear", "fashion", "merch", "accessor", "jewel"],
  },
  {
    triggers: ["jewel", "jewelry", "jewellery", "necklace", "chain", "bracelet", "earring", "anklet", "pendant", "ring", "bead"],
    categoryIds: ["jewelries", "accessories"],
    categoryKeywords: ["jewel", "accessor"],
  },
  {
    triggers: ["perfum", "fragran", "scent", "cologn", "spray", "mist", "oud", "deodor", "rollon", "attar"],
    categoryIds: ["fragrances"],
    categoryKeywords: ["fragran", "perfum", "scent"],
  },
  {
    triggers: ["beauty", "skincare", "skin", "lotion", "cream", "soap", "makeup", "cosmetic", "serum", "haircare"],
    categoryIds: ["beauty-skincare-personal-care", "care"],
    categoryKeywords: ["beauty", "skincare", "skin", "care"],
  },
  {
    triggers: ["gadget", "tech", "electronic", "phone", "charger", "earbud", "earpiece", "headphone", "airpod", "powerbank", "laptop", "speaker"],
    categoryIds: ["gadgets", "electronics", "gadgets---accessories"],
    categoryKeywords: ["gadget", "electr", "tech"],
  },
  {
    triggers: ["grocer", "provision", "foodstuff", "pantry", "supermarket"],
    categoryIds: ["groceries"],
    categoryKeywords: ["grocer"],
  },
  {
    triggers: ["stationer", "notebook", "pen", "pencil", "biro", "paper", "textbook", "calculator"],
    categoryIds: ["stationery"],
    categoryKeywords: ["stationer"],
  },
  {
    triggers: ["decor", "interior", "aesthetic", "asthetic", "ornament"],
    categoryIds: ["decorations", "interior-decorations"],
    categoryKeywords: ["decor", "interior", "asthetic", "aesthetic"],
  },
  {
    triggers: ["car", "automobile", "vehicl", "bike", "bicycl", "motor"],
    categoryIds: ["automobile"],
    categoryKeywords: ["automobile", "auto"],
  },
  {
    triggers: ["drug", "medic", "pharm", "health", "clinic"],
    categoryIds: ["medical"],
    categoryKeywords: ["medic", "pharm", "health"],
  },
  {
    triggers: ["laundr", "wash", "ironing", "detergent", "dryclean"],
    categoryIds: ["laundry"],
    categoryKeywords: ["laundr"],
  },
  {
    triggers: ["sport", "gym", "jersey", "football", "fitness", "workout"],
    categoryIds: ["sports", "sports-wears"],
    categoryKeywords: ["sport"],
  },
];

function tokenMatchesTrigger(token: string, trigger: string): boolean {
  if (trigger.length <= 3) return token === trigger || token === `${trigger}s`;
  // Prefix both ways so partially-typed words ("perf", "spra") still activate the group.
  return token.startsWith(trigger) || (token.length >= 4 && trigger.startsWith(token));
}

export interface ParsedQuery {
  /** Normalised full phrase, e.g. "hot shawarma". */
  phrase: string;
  /** Meaningful tokens, e.g. ["hot", "shawarma"]. */
  tokens: string[];
  /** Category ids implied by synonyms (e.g. "perfume" → "fragrances"). */
  synonymCategoryIds: string[];
  /** Stems for matching category text implied by synonyms. */
  synonymCategoryKeywords: string[];
}

export function parseSearchQuery(query?: string | null): ParsedQuery {
  const tokens = tokenizeQuery(query);
  const ids = new Set<string>();
  const keywords = new Set<string>();
  for (const group of SYNONYM_GROUPS) {
    const active = tokens.some((t) => group.triggers.some((trigger) => tokenMatchesTrigger(t, trigger)));
    if (active) {
      group.categoryIds.forEach((id) => ids.add(id));
      group.categoryKeywords.forEach((k) => keywords.add(k));
    }
  }
  return {
    phrase: tokens.join(" "),
    tokens,
    synonymCategoryIds: Array.from(ids),
    synonymCategoryKeywords: Array.from(keywords),
  };
}

/* ───────────────────────────── Typo tolerance ───────────────────────────── */

/** Bounded Levenshtein distance; returns `max + 1` as soon as the distance exceeds `max`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      curr.push(value);
      if (value < rowMin) rowMin = value;
    }
    if (rowMin > max) return max + 1;
    prev = curr;
  }
  return prev[b.length];
}

/** True when `token` is a likely typo of one of the words (e.g. "shwarma" ≈ "shawarma"). */
function fuzzyWordMatch(token: string, words: string[]): boolean {
  if (token.length < 4) return false;
  const maxDistance = token.length >= 7 ? 2 : 1;
  return words.some((w) => w.length >= 3 && editDistance(token, w, maxDistance) <= maxDistance);
}

/* ───────────────────────────── Field scoring ───────────────────────────── */

interface FieldWeights {
  exact: number;
  prefix: number;
  contains: number;
}

function scoreField(token: string, text: string, words: string[], weights: FieldWeights): number {
  if (!text) return 0;
  if (words.includes(token)) return weights.exact;
  if (words.some((w) => w.startsWith(token))) return weights.prefix;
  // Substring matches only for 3+ character tokens to avoid noise ("in" inside "drinks").
  if (token.length >= 3 && text.includes(token)) return weights.contains;
  return 0;
}

const NAME_WEIGHTS: FieldWeights = { exact: 30, prefix: 22, contains: 12 };
const VENDOR_WEIGHTS: FieldWeights = { exact: 14, prefix: 10, contains: 6 };
const CATEGORY_WEIGHTS: FieldWeights = { exact: 12, prefix: 10, contains: 5 };
const DESCRIPTION_WEIGHTS: FieldWeights = { exact: 5, prefix: 4, contains: 0 };

function categoryMatchesSynonyms(
  parsed: ParsedQuery,
  categoryId?: string | null,
  categoryTexts: string[] = []
): boolean {
  if (parsed.synonymCategoryIds.length === 0) return false;
  // A real category id is authoritative (avoids "Gadgets & Accessories" matching fashion's "accessor").
  if (categoryId) return parsed.synonymCategoryIds.includes(categoryId);
  return categoryTexts.some(
    (text) => !!text && parsed.synonymCategoryKeywords.some((stem) => textHasStem(text, stem))
  );
}

export interface ScorableProduct {
  name?: string | null;
  vendorName?: string | null;
  category?: string | null;
  categoryId?: string | null;
  storeCategory?: string | null;
  description?: string | null;
  isAvailable?: boolean;
}

/**
 * Relevance score for a product (0 = not a match).
 * - Every matched query word adds points (title > vendor > category > description).
 * - Matching ALL words and matching the full phrase in the title earn large bonuses.
 * - Partially matching queries ("hot shawarma") still return the "shawarma" items, ranked lower
 *   than items matching every word.
 * - Synonym-only matches ("perfume" → Fragrances) are included with a small score.
 */
export function scoreProduct(product: ScorableProduct, parsed: ParsedQuery): number {
  if (parsed.tokens.length === 0) return 0;

  const name = normalizeText(product.name);
  const vendor = normalizeText(product.vendorName);
  const category = normalizeText([product.category, product.storeCategory].filter(Boolean).join(" "));
  // Drop the encoded "[OPTIONS: {...}]" metadata block so JSON keys never produce matches.
  const description = normalizeText((product.description || "").replace(/\[OPTIONS:[\s\S]*\]/, ""));

  const nameWords = name.split(" ").filter(Boolean);
  const vendorWords = vendor.split(" ").filter(Boolean);
  const categoryWords = category.split(" ").filter(Boolean);
  const descriptionWords = description.split(" ").filter(Boolean);

  let total = 0;
  let matchedTokens = 0;

  for (const token of parsed.tokens) {
    let best = Math.max(
      scoreField(token, name, nameWords, NAME_WEIGHTS),
      scoreField(token, vendor, vendorWords, VENDOR_WEIGHTS),
      scoreField(token, category, categoryWords, CATEGORY_WEIGHTS),
      scoreField(token, description, descriptionWords, DESCRIPTION_WEIGHTS)
    );
    if (best === 0 && (fuzzyWordMatch(token, nameWords) || fuzzyWordMatch(token, vendorWords))) {
      best = 8;
    }
    if (best > 0) {
      matchedTokens++;
      total += best;
    }
  }

  const synonymMatch = categoryMatchesSynonyms(parsed, product.categoryId, [
    product.category || "",
    product.storeCategory || "",
  ]);

  if (matchedTokens === 0) {
    return synonymMatch ? 4 : 0;
  }

  const coverage = matchedTokens / parsed.tokens.length;
  let score = total * (0.5 + 0.5 * coverage);
  if (matchedTokens === parsed.tokens.length) score += 20;

  if (parsed.phrase) {
    if (name === parsed.phrase) score += 60;
    else if (name.startsWith(parsed.phrase)) score += 30;
    else if (parsed.tokens.length > 1 && name.includes(parsed.phrase)) score += 25;
  }

  if (synonymMatch) score += 3;
  if (product.isAvailable === false) score *= 0.7;

  return score;
}

export interface ScorableStore {
  name?: string | null;
  description?: string | null;
  category?: string | null;
  serviceSubcategory?: string | null;
}

/** Relevance score for a store (0 = not a match). */
export function scoreStore(store: ScorableStore, parsed: ParsedQuery): number {
  if (parsed.tokens.length === 0) return 0;

  const name = normalizeText(store.name);
  const category = normalizeText([store.category, store.serviceSubcategory].filter(Boolean).join(" "));
  const description = normalizeText(store.description);
  const nameWords = name.split(" ").filter(Boolean);
  const categoryWords = category.split(" ").filter(Boolean);
  const descriptionWords = description.split(" ").filter(Boolean);

  let total = 0;
  let matchedTokens = 0;
  for (const token of parsed.tokens) {
    let best = Math.max(
      scoreField(token, name, nameWords, { exact: 30, prefix: 22, contains: 14 }),
      scoreField(token, category, categoryWords, CATEGORY_WEIGHTS),
      scoreField(token, description, descriptionWords, DESCRIPTION_WEIGHTS)
    );
    if (best === 0 && fuzzyWordMatch(token, nameWords)) best = 8;
    if (best > 0) {
      matchedTokens++;
      total += best;
    }
  }

  const synonymMatch = categoryMatchesSynonyms(parsed, null, [store.category || "", store.serviceSubcategory || ""]);

  if (matchedTokens === 0) return synonymMatch ? 4 : 0;

  let score = total * (0.5 + 0.5 * (matchedTokens / parsed.tokens.length));
  if (matchedTokens === parsed.tokens.length) score += 20;
  if (parsed.phrase && name === parsed.phrase) score += 60;
  else if (parsed.phrase && name.startsWith(parsed.phrase)) score += 30;
  if (synonymMatch) score += 3;
  return score;
}

/* ───────────────────────────── Category pills ───────────────────────────── */

/** Stems used by the search page category pills (matched against product/store category text). */
const CATEGORY_PILL_STEMS: Record<string, string[]> = {
  services: ["service", "medic", "pharm", "health", "drug", "laundr", "wash", "clean", "errand", "barb", "hair", "repair", "print", "tailor", "tutor", "photo"],
  food: ["food", "meal", "cafeteria", "kitchen", "cook", "dish", "rice", "swallow", "shawarma", "lunch", "dinner", "breakfast"],
  pastries: ["pastr", "bakery", "bread", "cake", "confection", "pie", "donut", "doughnut", "puff", "roll"],
  snacks: ["snack", "chop", "chips", "popcorn", "cookie", "biscuit", "nuts", "sweet", "treat", "munch"],
  drinks: ["drink", "juice", "beverage", "zobo", "smoothie", "shake", "soda", "water", "yoghurt", "yogurt", "coffee", "tea", "boba", "malt"],
  groceries: ["grocer", "provision", "foodstuff", "noodle", "indomie", "milk", "cereal", "milo", "sugar", "biscuit", "dorm essential"],
  wears: ["wear", "fashion", "cloth", "merch", "apparel", "hoodie", "shirt", "pant", "jean", "t-shirt", "tee", "cap", "jacket", "dress", "thrift"],
  fashion: ["wear", "fashion", "cloth", "merch", "apparel", "hoodie", "shirt", "pant", "jean", "t-shirt", "tee", "cap", "jacket", "dress", "thrift"],
  jewelries: ["jewel", "jewelry", "jewellery", "chain", "ring", "bracelet", "watch", "wristwatch", "pendant", "necklace", "earring", "anklet", "bling", "ice", "sunglass"],
  fragrances: ["fragran", "perfum", "scent", "cologn", "oud", "spray", "mist", "rollon", "roll-on", "deodor", "attar", "oil"],
  care: ["care", "beauty", "skin", "skincare", "lotion", "cream", "soap", "hair", "haircare", "cosmetic", "makeup", "serum", "lip", "body wash", "hygiene"],
  "beauty & care": ["care", "beauty", "skin", "skincare", "lotion", "cream", "soap", "hair", "haircare", "cosmetic", "makeup", "serum", "lip", "body wash", "hygiene"],
  gadgets: ["gadget", "tech", "phone", "charger", "powerbank", "earbud", "earpiece", "headphone", "cable", "laptop", "usb", "screen guard", "case", "bluetooth", "speaker", "electronic"],
  "tech & gadgets": ["gadget", "tech", "phone", "charger", "powerbank", "earbud", "earpiece", "headphone", "cable", "laptop", "usb", "screen guard", "case", "bluetooth", "speaker", "electronic"],
  stationery: ["stationery", "book", "note", "notepad", "pen", "pencil", "calculator", "exam", "ruler", "folder", "highlighter", "study", "jotter"],
  sports: ["sport", "fitness", "gym", "jersey", "workout", "dumbbell", "boot", "sneaker", "ball", "skipping", "resistance", "athlet"],
  decorations: ["decor", "interior", "asthetic", "aesthetic", "light", "fairy light", "frame", "wall", "poster", "plush", "pillow", "rug", "curtain"],
  automobile: ["automobile", "auto", "car", "bike", "bicycle", "motorbike", "power bike", "scooter", "ride", "helmet", "tyre"],
};

/** Stems that disqualify a category from a pill (e.g. "Gadgets & Accessories" is not Fashion). */
const CATEGORY_PILL_EXCLUDES: Record<string, string[]> = {
  fashion: ["gadget", "electr", "phone", "jewel", "chain", "ring", "bracelet", "perfum", "fragran"],
  wears: ["gadget", "electr", "phone", "jewel", "chain", "ring", "bracelet", "perfum", "fragran"],
  food: ["snack", "pastr", "cake", "pie"],
  jewelries: ["phone", "gadget", "hoodie", "shirt", "pant"],
};

/**
 * True when a product (by its category and, as a fallback, its store's category) belongs to the
 * selected category pill. Uncategorised products never leak into every category.
 */
export function matchesCategoryPill(
  selectedCategory: string,
  productCategory?: string | null,
  storeCategory?: string | null
): boolean {
  const selected = selectedCategory.toLowerCase().trim();
  if (selected === "all") return true;

  const canonicalSlug = normalizeCategorySlug(selectedCategory);
  const aliases = getCategoryAliases(canonicalSlug).map((a) => a.toLowerCase());

  // 1. Direct ID / alias match on productCategory
  if (productCategory) {
    const prodClean = productCategory.toLowerCase().trim();
    const prodSlug = normalizeCategorySlug(prodClean);
    if (prodSlug === canonicalSlug || aliases.includes(prodClean)) {
      return true;
    }
  }

  // 2. Direct ID / alias match on storeCategory (fallback if product has no specific category)
  if (!productCategory && storeCategory) {
    const storeClean = storeCategory.toLowerCase().trim();
    const storeSlug = normalizeCategorySlug(storeClean);
    if (storeSlug === canonicalSlug || aliases.includes(storeClean)) {
      return true;
    }
  }

  // 3. Keyword / stem matching
  const texts = [productCategory, storeCategory].filter(
    (t): t is string => typeof t === "string" && t.trim().length > 0
  );
  if (texts.length === 0) return false;

  const stems =
    CATEGORY_PILL_STEMS[canonicalSlug] ||
    CATEGORY_PILL_STEMS[selected] ||
    [selected];
  const candidates = productCategory && productCategory.trim() ? [productCategory] : texts;
  const excludes = CATEGORY_PILL_EXCLUDES[canonicalSlug] || CATEGORY_PILL_EXCLUDES[selected] || [];

  return candidates.some(
    (text) =>
      stems.some((stem) => textHasStem(text, stem)) &&
      !excludes.some((stem) => textHasStem(text, stem))
  );
}
