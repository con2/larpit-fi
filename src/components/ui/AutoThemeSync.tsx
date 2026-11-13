"use client";

import { useLayoutEffect } from "react";

import { applyAutoTheme } from "./themeClient";

/**
 * The inline auto theme script runs once per page load, but React recreates `<html>` without
 * the scheme the script set when the root layout mounts again, as it does after Next.js' own
 * error page has replaced the document. Applying it on mount covers that.
 */
export default function AutoThemeSync() {
  useLayoutEffect(applyAutoTheme, []);
  return null;
}
