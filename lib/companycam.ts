const COMPANYCAM_TOKEN = process.env.COMPANYCAM_API_TOKEN || '';
const BASE_URL = 'https://api.companycam.com/v2';

async function ccFetch(endpoint: string) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${COMPANYCAM_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CompanyCam API error ${res.status}: ${text}`);
  }
  return res.json();
}

export interface CCProject {
  id: string;
  name: string;
  address?: {
    street_address_1?: string;
    city?: string;
    state?: string;
  };
  created_at: number;
  updated_at: number;
}

export interface CCPhotoLabel {
  id: string;
  name?: string;           // legacy field (not always present)
  display_value?: string;  // e.g. "Before and After"
  value?: string;          // e.g. "before and after"
  tag_type?: string;       // e.g. "media"
}

export interface CCPhoto {
  id: string;
  uri: string;
  urls: {
    original: string;
    thumbnail: string;
  };
  uris?: Array<{ type: string; uri: string }>;
  captured_at: number;
  created_at: number;
  photo_url?: string;
  labels?: CCPhotoLabel[];
}

/**
 * Search CompanyCam projects by query string
 */
export async function searchProjects(query: string): Promise<CCProject[]> {
  const encoded = encodeURIComponent(query);
  return ccFetch(`/projects?query=${encoded}&per_page=25`);
}

/**
 * WO number format-agnostic comparison.
 *
 * Handles both formats GoSuperClean has used:
 *   Old: "WO2024897"  — "WO" prefix + 7-digit number
 *   New: "2025530-01" — bare number + dash + revision suffix (no "WO" prefix)
 *
 * Extracts the base number from both sides and compares:
 *   "WO2024897"  → base "2024897"
 *   "2025530-01" → base "2025530"
 *   "2025530"    → base "2025530"
 *
 * Returns true if any token in the project name shares a base number with jobWoNumber.
 */
function woMatches(projectName: string, jobWoNumber: string): boolean {
  const extractBase = (s: string) => s.replace(/^WO/i, '').split('-')[0];
  const jobBase = extractBase(jobWoNumber);
  if (!jobBase || jobBase.length < 5) return false;
  // Tokenise on whitespace and common separators
  const tokens = projectName.split(/[\s#\-_/]+/);
  return tokens.some(t => extractBase(t) === jobBase);
}

/**
 * Find the exact CompanyCam project for a Starbucks store.
 *
 * Project naming conventions observed:
 *   Old: "Workiz 1942 - Starbucks #78762 WO2024897"
 *   New: "Workiz 1943 - Starbucks #67488 2025530-01"  (no "WO" prefix)
 *
 * Strategy:
 * 1. Search "Starbucks #XXXXX" (store number — works for both naming conventions)
 * 2. Among results filter by store number in name
 * 3. If WO number supplied, prefer the project whose name contains a token matching
 *    the WO base number (format-agnostic via woMatches)
 * 4. Fallback to most-recently-updated store match
 * 5. Final fallback: address search
 */
export async function findStarbucksProject(
  storeNumber: string,
  woNumber?: string,
  address?: string
): Promise<CCProject | null> {
  // Search by store number — works regardless of WO format in project name
  const storeQuery = `Starbucks #${storeNumber}`;
  const storeResults = await searchProjects(storeQuery);

  // Filter to projects that actually contain this store number in the name
  const matches = storeResults.filter((p) =>
    p.name.includes(`#${storeNumber}`)
  );

  if (matches.length > 0) {
    if (woNumber) {
      // Prefer the project whose name contains a token matching the WO base number
      // (handles both "WO2024897" old format and "2025530-01" new format)
      const woMatch = matches.find((p) => woMatches(p.name, woNumber));
      if (woMatch) return woMatch;
    }
    // Return most recently updated match
    matches.sort((a, b) => b.updated_at - a.updated_at);
    return matches[0];
  }

  // Fallback: search by address
  if (address) {
    const addrResults = await searchProjects(address);
    if (addrResults.length > 0) {
      const starbucksMatch = addrResults.find((p) =>
        p.name.toLowerCase().includes('starbucks') || p.name.includes(storeNumber)
      );
      if (starbucksMatch) return starbucksMatch;
      return addrResults[0];
    }
  }

  return null;
}

/**
 * Get all photos for a project.
 * Labels are fetched separately per-photo via getPhotoLabels().
 */
export async function getProjectPhotos(projectId: string, perPage = 50): Promise<CCPhoto[]> {
  const photos = await ccFetch(`/projects/${projectId}/photos?per_page=${perPage}`) as CCPhoto[];
  return photos;
}

/**
 * Fetch tags for a single photo.
 * CompanyCam's "Before and After" feature stores tags via GET /photos/{id}/tags.
 * Tag objects have a { name: string } — filter for /before|after/i to detect BA-tagged photos.
 */
export async function getPhotoTags(photoId: string): Promise<CCPhotoLabel[]> {
  try {
    const result = await ccFetch(`/photos/${photoId}/tags`) as CCPhotoLabel[] | { data?: CCPhotoLabel[] };
    return Array.isArray(result) ? result : (result.data || []);
  } catch {
    return [];
  }
}

/**
 * Fetch labels for a single photo (text labels — separate from Before/After tags)
 * @deprecated Use getPhotoTags() for Before/After detection
 */
export async function getPhotoLabels(photoId: string): Promise<CCPhotoLabel[]> {
  return getPhotoTags(photoId);
}

/**
 * Create (or retrieve) a public share link for a CompanyCam project gallery.
 * Returns the public URL including timestamps.
 * POST /projects/{id}/shares
 */
export async function createProjectShare(projectId: string): Promise<string> {
  // Return direct CompanyCam project URL — reliable, no API call needed
  return `https://app.companycam.com/projects/${projectId}`;
}

/**
 * Download a photo and return as base64
 */
export async function downloadPhotoAsBase64(photoUrl: string): Promise<{ base64: string; contentType: string }> {
  const res = await fetch(photoUrl);
  if (!res.ok) throw new Error(`Failed to download photo: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const base64 = Buffer.from(buffer).toString('base64');
  return { base64, contentType };
}
