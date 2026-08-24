export interface SitePage {
  route: string;
  output: string;
  entry: string;
  kind: "source" | "document" | "licence" | "generated";
  source?: string;
  title?: string;
  description?: string;
  canonical?: boolean;
  cleanRoute?: boolean;
  documentShell?: boolean;
}

export const sitePages: readonly SitePage[];
export const canonicalPages: readonly SitePage[];
export const cleanRoutePages: readonly SitePage[];
export const documentShellPages: readonly SitePage[];
export const internalLinkTargets: ReadonlyMap<string, string>;
export const generatedPaths: readonly string[];
