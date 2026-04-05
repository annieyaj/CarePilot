/**
 * Browser Use Cloud: add grocery lines to Walmart cart (US).
 * Optional Browser Use profile may already be logged into Walmart (see BROWSER_USE_PROFILE_ID).
 */

const MAX_ITEMS = 15;

/**
 * @param {{ mealTitle?: string, items?: string[], useLoggedInProfile?: boolean }} input
 * @returns {string}
 */
export function buildWalmartCartTask(input) {
  const mealTitle = String(input.mealTitle ?? "").slice(0, 120);
  const useLoggedIn = Boolean(input.useLoggedInProfile);
  const rawItems = Array.isArray(input.items) ? input.items : [];
  const items = rawItems
    .map((x) => String(x ?? "").trim())
    .filter(Boolean)
    .slice(0, MAX_ITEMS);

  const itemsBlock = items.map((q, i) => `${i + 1}. ${q}`).join("\n");

  const profilePreamble = useLoggedIn
    ? [
        "This browser uses a saved Browser Use profile that may ALREADY be signed into the shopper's Walmart account.",
        "If already signed in: add each item to that account's cart (Add to cart). Do not sign out. Do not open checkout or enter payment.",
        "If not signed in: try guest add-to-cart; if that fails, record skipped_login.",
        "Never type Walmart passwords, 2FA codes, or card numbers. Skip steps that require CAPTCHA.",
      ]
    : [];

  const flowLines = useLoggedIn
    ? [
        "For EACH ingredient line below, in order:",
        "1) Use Walmart search for that ingredient.",
        "2) Pick the first clearly relevant edible grocery product (food), not unrelated merchandise.",
        "3) Open the product page and click Add to cart for the active session (signed-in cart if logged in, else guest if available).",
        "4) Do not proceed to checkout or payment.",
      ]
    : [
        "For EACH ingredient line below, in order:",
        "1) Use Walmart search for that ingredient.",
        "2) Pick the first clearly relevant edible grocery product (food), not unrelated merchandise.",
        "3) Open the product page and click Add to cart ONLY if you can do so without signing in, without entering passwords or payment, and without solving CAPTCHAs.",
        "If the site requires login to add to cart, or the button is missing, skip adding and continue to the next item.",
      ];

  const jsonHint = useLoggedIn
    ? "Set added true if the item landed in the cart. Use status added|skipped_login|skipped_blocked|not_found."
    : "Set added true only if the item was added to the cart without signing in.";

  return [
    "You are a grocery shopping assistant using Walmart.com in the United States.",
    "Start at https://www.walmart.com",
    "",
    ...profilePreamble,
    ...(profilePreamble.length > 0 ? [""] : []),
    ...flowLines,
    "",
    mealTitle ? `Meal / context: ${mealTitle}` : "",
    "Ingredients:",
    itemsBlock,
    "",
    "When finished, respond with ONLY valid JSON (no markdown fences, no commentary). Shape:",
    '{"mealTitle":"","results":[{"query":"","added":false,"product":"","productUrl":"","status":"added|skipped_login|skipped_blocked|not_found"}],"agentSummary":""}',
    jsonHint,
    "Use productUrl when you have a stable product page link; otherwise empty string.",
  ]
    .filter(Boolean)
    .join("\n");
}
