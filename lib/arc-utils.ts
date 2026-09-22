import arcsData from "../content/config/arcs.json";
import ifRoutesData from "../content/config/stories.json";
import { ArcConfig, IfRouteConfig } from "./schema";

export interface ArcMetadata {
  slug: string;
  name: string;
  type: "canon" | "if" | "side-story" | "general";
  order?: number;
  divergesFrom?: string | null;
  timeline?: string | null;
}

export const CANON_ARCS: ArcConfig[] = arcsData as ArcConfig[];
export const IF_ROUTES: IfRouteConfig[] = ifRoutesData as IfRouteConfig[];

export function getArcMetadata(slug: string): ArcMetadata {
  if (slug === "general") {
    return {
      slug: "general",
      name: "General / No Story Spoilers",
      type: "general",
    };
  }

  const canon = CANON_ARCS.find((a) => a.slug === slug);
  if (canon) {
    return {
      slug: canon.slug,
      name: canon.name,
      type: "canon",
      order: canon.order,
    };
  }

  const ifRoute = IF_ROUTES.find((r) => r.slug === slug);
  if (ifRoute) {
    return {
      slug: ifRoute.slug,
      name: ifRoute.name,
      type: ifRoute.type === "side-story" ? "side-story" : "if",
      divergesFrom: ifRoute.divergesFrom,
      timeline: ifRoute.timeline,
    };
  }

  return {
    slug,
    name: slug,
    type: "general",
  };
}

export function isArcSpoiler(
  arcSlug: string,
  spoilerArc: number,
  allowedIf: boolean | string[]
): boolean {
  const meta = getArcMetadata(arcSlug);
  if (meta.type === "general") return false;
  if (meta.type === "canon" && meta.order !== undefined) {
    return meta.order > spoilerArc;
  }
  if (meta.type === "if" || meta.type === "side-story") {
    if (Array.isArray(allowedIf)) {
      return !allowedIf.includes(arcSlug);
    }
    return !allowedIf;
  }
  return false;
}
