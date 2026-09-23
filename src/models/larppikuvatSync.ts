import { publicUrl } from "@/config";
import {
  EditAction,
  EditStatus,
  LarpLinkType,
  SubmitterRole,
} from "@/generated/prisma/client";
import prisma from "@/prisma";
import z from "zod";
import { approveRequest } from "./ModerationRequest";

const Subalbum = z.object({
  path: z.string(),
  eventMetadataUrl: z.string().optional().default(""),
});

const RootAlbum = z.object({
  subalbums: z.array(Subalbum),
});

const larpPathRegex =
  /^\/larp\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i;

const userAgent = `larpit.fi (+${publicUrl})`;
const fetchTimeoutMs = 30_000;

export const syncMessage = "Lisätty automaattisesti Larppikuvat.fi:stä";

/** Host without `www.` and path without trailing slash, so that equivalent URLs compare equal. */
function normalizeUrl(href: string): { host: string; path: string } | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  return {
    host: url.hostname.toLowerCase().replace(/^www\./, ""),
    path: url.pathname.replace(/\/+$/, ""),
  };
}

/** Larp id from `https://larpit.fi/larp/<uuid>` (or the same path on this instance). */
export function larpIdFromUrl(href: string): string | null {
  const url = normalizeUrl(href);
  if (!url) return null;
  const ownHosts = new Set(["larpit.fi", normalizeUrl(publicUrl)?.host]);
  if (!ownHosts.has(url.host)) return null;
  return url.path.match(larpPathRegex)?.[1].toLowerCase() ?? null;
}

export interface SyncResult {
  added: number;
  unchanged: number;
  mismatched: number;
  missing: number;
}

/**
 * Adds a PHOTOS link to every larp that a public top-level album of the given
 * Edegal instance points to with its `eventMetadataUrl`, unless the larp
 * already links to some album on that instance.
 */
export async function syncFromLarppikuvat({
  apiUrl,
  fetchImpl = fetch,
}: {
  apiUrl: string;
  fetchImpl?: typeof fetch;
}): Promise<SyncResult> {
  const response = await fetchImpl(apiUrl, {
    headers: { "User-Agent": userAgent, Accept: "application/json" },
    signal: AbortSignal.timeout(fetchTimeoutMs),
  });
  if (!response.ok) {
    throw new Error(`${apiUrl} responded with HTTP ${response.status}`);
  }
  const root = RootAlbum.parse(await response.json());
  const origin = new URL(apiUrl).origin;

  const user = await prisma.user.upsert({
    where: { email: "yhteys@larppikuvat.fi" },
    update: {},
    create: {
      email: "yhteys@larppikuvat.fi",
      name: "Larppikuvat.fi ylläpito",
    },
    select: { id: true, name: true, email: true, role: true },
  });

  const result: SyncResult = {
    added: 0,
    unchanged: 0,
    mismatched: 0,
    missing: 0,
  };

  for (const subalbum of root.subalbums) {
    const larpId = larpIdFromUrl(subalbum.eventMetadataUrl);
    if (!larpId) continue;

    const albumHref = new URL(subalbum.path, origin).toString();
    const album = normalizeUrl(albumHref)!;

    const larp = await prisma.larp.findUnique({
      where: { id: larpId },
      select: {
        id: true,
        links: { where: { type: LarpLinkType.PHOTOS }, select: { href: true } },
      },
    });
    if (!larp) {
      console.warn(
        `larppikuvat sync: album ${albumHref} points to unknown larp ${subalbum.eventMetadataUrl}`,
      );
      result.missing++;
      continue;
    }

    const sameSiteLinks = larp.links
      .map((link) => ({ href: link.href, url: normalizeUrl(link.href) }))
      .filter(({ url }) => url?.host === album.host);
    const alreadyLinked = sameSiteLinks.some(
      ({ url }) =>
        url!.path === album.path || url!.path.startsWith(album.path + "/"),
    );
    if (alreadyLinked) {
      result.unchanged++;
      continue;
    }
    if (sameSiteLinks.length > 0) {
      console.warn(
        `larppikuvat sync: album ${albumHref} points to larp ${larp.id}, but the larp links to ${sameSiteLinks.map(({ href }) => href).join(", ")}`,
      );
      result.mismatched++;
      continue;
    }

    const request = await prisma.moderationRequest.create({
      data: {
        action: EditAction.UPDATE,
        status: EditStatus.APPROVED,
        larpId: larp.id,
        submitterId: user.id,
        submitterName: user.name || "",
        submitterEmail: user.email,
        submitterRole: SubmitterRole.NONE,
        message: syncMessage,
        newContent: {},
        addLinks: [{ type: LarpLinkType.PHOTOS, href: albumHref }],
      },
    });
    await approveRequest(request, user, syncMessage, EditStatus.APPROVED);
    console.log("AUDIT", "syncFromLarppikuvat", {
      actorUserId: user.id,
      larpId: larp.id,
      href: albumHref,
    });
    result.added++;
  }

  return result;
}
