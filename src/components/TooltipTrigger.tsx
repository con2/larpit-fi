"use client";

import { ReactNode } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

interface Props {
  tooltip: ReactNode;
  children: ReactNode;
}

/**
 * OverlayTrigger reads `props.ref` off its child, which fails when the child arrives from a
 * server component as an unresolved Flight reference (it does once the payload is large enough
 * to be split into chunks). Creating the child element here keeps it a plain element.
 */
export default function TooltipTrigger({ tooltip, children }: Props) {
  return (
    <OverlayTrigger overlay={<Tooltip>{tooltip}</Tooltip>}>
      <span>{children}</span>
    </OverlayTrigger>
  );
}
