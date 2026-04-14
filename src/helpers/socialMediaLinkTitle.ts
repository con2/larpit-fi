export function socialMediaLinkTitleFromHref(href: string): string | null {
  href = href.trim();

  // NOTE none of these should point to the root of the service
  if (
    href.startsWith("https://instagram.com/") ||
    href.startsWith("https://www.instagram.com/")
  ) {
    return "Instagram";
  } else if (
    href.startsWith("https://x.com/") ||
    href.startsWith("https://twitter.com/")
  ) {
    return "Twitter";
  } else if (
    href.startsWith("https://facebook.com/") ||
    href.startsWith("https://fb.me/")
  ) {
    return "Facebook";
  } else if (href.startsWith("https://discord.gg/")) {
    return "Discord";
  } else if (
    href.startsWith("https://youtu.be/") ||
    href.startsWith("https://www.youtube.com/")
  ) {
    return "YouTube";
  }

  return null;
}
