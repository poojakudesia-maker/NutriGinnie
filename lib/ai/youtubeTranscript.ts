/**
 * Fetches a YouTube video's auto-generated/uploaded captions with no API key,
 * using the same public caption-track endpoint the YouTube player itself
 * calls. This is a best-effort auto-fetch: some videos have captions
 * disabled entirely, in which case callers should fall back to asking the
 * user to paste the recipe text/description manually (see RecipeForm.tsx).
 */

function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return parsed.pathname.slice(1).split("/")[0] || null;
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      const shortsMatch = parsed.pathname.match(/^\/(shorts|embed|live)\/([^/]+)/);
      if (shortsMatch) return shortsMatch[2];
    }
    return null;
  } catch {
    return null;
  }
}

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string; // "asr" = auto-generated
}

async function fetchCaptionTracks(videoId: string): Promise<CaptionTrack[]> {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) {
    throw new Error(`Could not load the YouTube video page (${res.status}).`);
  }
  const html = await res.text();

  const match = html.match(/"captionTracks":(\[.*?\])(?=,"(?:audioTracks|translationLanguages)")/);
  if (!match) return [];

  try {
    return JSON.parse(match[1]) as CaptionTrack[];
  } catch {
    return [];
  }
}

interface Json3Event {
  segs?: { utf8?: string }[];
}

function parseJson3Transcript(json: string): string {
  const data = JSON.parse(json) as { events?: Json3Event[] };
  const lines = (data.events ?? [])
    .flatMap((event) => event.segs ?? [])
    .map((seg) => seg.utf8 ?? "")
    .join("");
  return lines.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Returns the video's transcript as plain text, or throws if no captions
 * are available. Prefers an English track, falling back to the first
 * available language.
 */
export async function fetchYouTubeTranscript(url: string): Promise<string> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error("Could not parse a YouTube video ID from that link.");
  }

  const tracks = await fetchCaptionTracks(videoId);
  if (tracks.length === 0) {
    throw new Error("This video has no captions/transcript available to fetch automatically.");
  }

  const track =
    tracks.find((t) => t.languageCode?.startsWith("en")) ?? tracks[0];

  const transcriptRes = await fetch(`${track.baseUrl}&fmt=json3`);
  if (!transcriptRes.ok) {
    throw new Error(`Could not download the caption track (${transcriptRes.status}).`);
  }
  const transcript = parseJson3Transcript(await transcriptRes.text());
  if (!transcript) {
    throw new Error("The caption track was empty.");
  }
  return transcript;
}
