/** Runs once per server start, before requests are served. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { ensureFrontPages } = await import("@/models/Page");
  try {
    await ensureFrontPages();
  } catch (error) {
    // Missing front pages only leave the front page bare; the site must still come up if the
    // database is briefly unavailable at startup.
    console.error("ensureFrontPages failed:", error);
  }
}
