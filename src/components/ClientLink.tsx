// Next 16+ and react-bootstrap need an explicit client component wrapper for
// <Link> so that <SomeReactBootstrapComponent as={Link} /> works properly.
// Fixes a "Functions cannot be passed directly to Client Components" error.

"use client";

import Link from "next/link";

export default Link;
