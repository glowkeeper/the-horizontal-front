export interface SitePage {
  route: string;
  output: string;
  entry: string;
  kind: "source" | "document" | "licence" | "generated";
  source?: string;
  title?: string;
  description?: string;
  canonical?: boolean;
  documentShell?: boolean;
  nav?: { group: "primary" | "footer"; label: string };
}

export const sitePages: readonly SitePage[];
export const canonicalPages: readonly SitePage[];
export const cleanRoutePages: readonly SitePage[];
export const documentShellPages: readonly SitePage[];
export const primaryNavigation: readonly SitePage[];
export const footerNavigation: readonly SitePage[];
export const internalLinkTargets: ReadonlyMap<string, string>;
export const generatedPaths: readonly string[];
