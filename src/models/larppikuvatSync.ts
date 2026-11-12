import { publicUrl } from "@/config";
import z from "zod";

import { db } from "@/prisma/db";
import {
  EditAction,
  EditStatus,
  LarpLinkType,
  SubmitterRole,
} from "@/prisma/enums";
import { toJson } from "@/prisma/json";
import {
  findLarpByAliasRedirect,
  larpIdOrAliasFilter,
  type LarpIdOrAliasFilter,
} from "./Larp";
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
const aliasPathRegex = /^\/([^/]+)$/;

const userAgent = `larp.fi (+${publicUrl})`;
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

/**
 * The larp that `https://larp.fi/larp/<uuid>` or `https://larp.fi/<alias>` (or the same path on
 * the former larpit.fi domain or this instance) addresses.
 */
export function larpFilterFromUrl(href: string): LarpIdOrAliasFilter | null {
  const url = normalizeUrl(href);
  if (!url) return null;
  const ownHosts = new Set([
    "larp.fi",
    "larpit.fi",
    normalizeUrl(publicUrl)?.host,
  ]);
  if (!ownHosts.has(url.host)) return null;
  const larpId = url.path.match(larpPathRegex)?.[1];
  if (larpId) return { id: larpId.toLowerCase() };
  const alias = url.path.match(aliasPathRegex)?.[1];
  const filter = alias ? larpIdOrAliasFilter(alias) : null;
  return filter && "alias" in filter ? filter : null;
}

function loadLarpWithPhotosLinks(filter: LarpIdOrAliasFilter) {
  return db.orm.public.Larp.select("id")
    .include("links", (links) =>
      links.where({ type: LarpLinkType.PHOTOS }).select("href"),
    )
    .first(filter);
}

/** Follows a former alias of a larp too. */
async function findLarpWithPhotosLinks(filter: LarpIdOrAliasFilter) {
  const larp = await loadLarpWithPhotosLinks(filter);
  if (larp || !("alias" in filter)) return larp;
  const redirectTarget = await findLarpByAliasRedirect(filter.alias);
  return redirectTarget
    ? loadLarpWithPhotosLinks({ id: redirectTarget.id })
    : null;
}

export interface SyncResult {
  added: number;
  unchanged: number;
  mismatched: number;
  missing: number;
}

/**
 * Adds a PHOTOS link to every larp that a public top-level album of the given
 * Edegal instance points to with its `eventMetadataUrl` (by id or by alias), unless the larp
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

  const user = await db.orm.public.User.select(
    "id",
    "name",
    "email",
    "role",
  ).upsert({
    create: {
      email: "yhteys@larppikuvat.fi",
      name: "Larppikuvat.fi ylläpito",
    },
    update: {},
    conflictOn: { email: "yhteys@larppikuvat.fi" },
  });

  const result: SyncResult = {
    added: 0,
    unchanged: 0,
    mismatched: 0,
    missing: 0,
  };

  for (const subalbum of root.subalbums) {
    const larpFilter = larpFilterFromUrl(subalbum.eventMetadataUrl);
    if (!larpFilter) continue;

    const albumHref = new URL(subalbum.path, origin).toString();
    const album = normalizeUrl(albumHref)!;

    const larp = await findLarpWithPhotosLinks(larpFilter);
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

    const request = await db.orm.public.ModerationRequest.create({
      action: EditAction.UPDATE,
      status: EditStatus.VERIFIED,
      larpId: larp.id,
      submitterId: user.id,
      submitterName: user.name || "",
      submitterEmail: user.email,
      submitterRole: SubmitterRole.NONE,
      message: syncMessage,
      newContent: {},
      addLinks: toJson([{ type: LarpLinkType.PHOTOS, href: albumHref }]),
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
