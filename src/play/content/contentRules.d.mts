export const contentIdPattern: RegExp;
export const assetFilePattern: RegExp;
export const copyPlaceholderPattern: RegExp;
export const maximumCampaignsWithoutPaging: number;
export function getCopyPlaceholders(template: string): string[];
export function hasStrayCopyBraces(template: string): boolean;
export const placeholderIdSegments: ReadonlySet<string>;
export function findPlaceholderIdSegment(id: string): string | undefined;
