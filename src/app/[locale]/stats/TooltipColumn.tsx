"use client";

import { CSSProperties, ReactNode } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

interface Props {
  tooltip: string;
  href?: string;
  className: string;
  style: CSSProperties;
  children: ReactNode;
}

/**
 * The column element is created here rather than passed in from the server component, because
 * OverlayTrigger reads `props.ref` off its child and a Flight reference has none (see
 * TooltipTrigger).
 */
export default function TooltipColumn({
  tooltip,
  href,
  className,
  style,
  children,
}: Props) {
  return (
    <OverlayTrigger overlay={<Tooltip>{tooltip}</Tooltip>}>
      {href ? (
        <a href={href} className={className} style={style} aria-label={tooltip}>
          {children}
        </a>
      ) : (
        <span className={className} style={style} aria-hidden="true">
          {children}
        </span>
      )}
    </OverlayTrigger>
  );
}
