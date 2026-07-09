import { NextRequest, NextResponse } from 'next/server';
import { searchProjects, findStarbucksProject, getProjectPhotos, getPhotoLabels, getPhotoTags, createProjectShare } from '@/lib/companycam';

const COMPANYCAM_TOKEN = process.env.COMPANYCAM_API_TOKEN || '';

/**
 * GET /api/companycam?storeNumber=00806&woNumber=1963606 — find exact project + photos + labels
 * GET /api/companycam?query=00806 — generic search
 * GET /api/companycam?projectId=123 — get photos for a specific project
 * GET /api/companycam?photoLabels=photoId — get labels for a single photo
 * GET /api/companycam?debugShare=projectId — debug: raw CC shares API response
 * POST /api/companycam { projectId } — create/get gallery share link
 */
export async function GET(req: NextRequest) {
  try {
    const storeNumber = req.nextUrl.searchParams.get('storeNumber');
    const woNumber = req.nextUrl.searchParams.get('woNumber');
    const query = req.nextUrl.searchParams.get('query');
    const projectId = req.nextUrl.searchParams.get('projectId');
    const photoLabels = req.nextUrl.searchParams.get('photoLabels');
    const debugShare = req.nextUrl.searchParams.get('debugShare');

    // Debug: raw CC shares API response — so we can see exactly what CC returns with real token
    if (debugShare) {
      const BASE_URL = 'https://api.companycam.com/v2';
      const res = await fetch(`${BASE_URL}/projects/${debugShare}/shares`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${COMPANYCAM_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ share_type: 'public' }),
      });
      const status = res.status;
      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();
      let parsed = null;
      try { parsed = JSON.parse(text); } catch { /* not JSON */ }
      return NextResponse.json({
        debug: true,
        status,
        contentType,
        body: parsed || text.slice(0, 500),
        tokenPresent: !!COMPANYCAM_TOKEN,
        tokenLength: COMPANYCAM_TOKEN.length,
      });
    }

    // Fetch labels for a single photo
    if (photoLabels) {
      const labels = await getPhotoLabels(photoLabels);
      return NextResponse.json({ success: true, labels });
    }

    // Direct photo fetch by project ID (with labels)
    if (projectId) {
      const photos = await getProjectPhotos(projectId);
      // Fetch labels for all photos in parallel (batch)
      const photosWithLabels = await Promise.all(
        photos.map(async (photo) => {
          const labels = await getPhotoTags(photo.id);
          return { ...photo, labels };
        })
      );
      return NextResponse.json({ success: true, photos: photosWithLabels });
    }

    // Smart Starbucks project finder — uses exact naming convention
    // "Starbucks #00806 WO# 1963606"
    if (storeNumber) {
      const address = req.nextUrl.searchParams.get('address');
      const project = await findStarbucksProject(storeNumber, woNumber || undefined, address || undefined);

      if (!project) {
        // Return all search results so user can pick manually
        const fallbackQuery = address || `Starbucks #${storeNumber}`;
        const fallbackResults = await searchProjects(fallbackQuery);
        return NextResponse.json({
          success: true,
          matched: false,
          project: null,
          photos: [],
          searchResults: fallbackResults,
          message: `No exact match for Starbucks #${storeNumber}${woNumber ? ` WO# ${woNumber}` : ''}. ${fallbackResults.length} similar project(s) found.`,
        });
      }

      // Found exact match — auto-load photos with tags
      const photos = await getProjectPhotos(project.id);
      const photosWithLabels = await Promise.all(
        photos.map(async (photo) => {
          const labels = await getPhotoTags(photo.id);
          return { ...photo, labels };
        })
      );
      return NextResponse.json({
        success: true,
        matched: true,
        project: { id: project.id, name: project.name },
        photos: photosWithLabels,
        message: `Found "${project.name}" with ${photos.length} photo(s).`,
      });
    }

    // Generic search fallback
    if (query) {
      const projects = await searchProjects(query);
      return NextResponse.json({ success: true, projects });
    }

    return NextResponse.json(
      { error: 'Provide ?storeNumber= (and optionally &woNumber=), ?query=, or ?projectId=' },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }
    const shareUrl = await createProjectShare(projectId);
    return NextResponse.json({ success: true, shareUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

