/** Runs once per server start, before requests are served. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { ensureDefaultPages } = await import("@/models/Page");
  try {
    await ensureDefaultPages();
  } catch (error) {
    // Missing default pages only leave the front page bare; the site must still come up if the
    // database is briefly unavailable at startup.
    console.error("ensureDefaultPages failed:", error);
  }
}
