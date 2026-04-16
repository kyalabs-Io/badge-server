import type { BadgeVisitContext } from "./types.js";

export function inferContextFromUrl(url: string): BadgeVisitContext {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (pathname.includes("/cart")) return "addtocart";
    if (pathname.includes("/checkout")) return "checkout";
  } catch {
    return "arrival";
  }
  return "arrival";
}
