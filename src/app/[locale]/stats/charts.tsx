import { ReactNode } from "react";

import styles from "./page.module.scss";
import TooltipColumn from "./TooltipColumn";

export type Tone =
  "text" | "ice" | "iceHalf" | "aurora" | "ember" | "dim" | "border" | "raised";

const toneClass: Record<Tone, string> = {
  text: styles.toneText,
  ice: styles.toneIce,
  iceHalf: styles.toneIceHalf,
  aurora: styles.toneAurora,
  ember: styles.toneEmber,
  dim: styles.toneDim,
  border: styles.toneBorder,
  raised: styles.toneRaised,
};

/** Rounds up to a multiple of half a power of ten, so the top and half-way gridlines land on round numbers. */
export function niceMax(max: number): number {
  if (max <= 0) return 1;
  const step = 10 ** Math.floor(Math.log10(max)) / 2;
  return Math.ceil(max / step) * step;
}

export interface ColumnBar {
  key: string;
  segments: { value: number; tone: Tone }[];
  /** Accessible name and tooltip of the bar. */
  title: string;
  href?: string;
  axisLabel?: string;
  highlightLabel?: boolean;
  /** Starts a group of bars, such as the weeks of a month, which gets a divider and this label. */
  groupLabel?: string;
}

/** Must stay in sync with the gap between `.columns` children in page.module.scss. */
const columnGapPx = 4;

/** Left edge of the bar at `index`, as a CSS length within a row of `count` bars. */
function columnOffset(index: number, count: number) {
  return `calc(${index} * (100% + ${columnGapPx}px) / ${count})`;
}

function getGroups(bars: ColumnBar[]) {
  const starts = bars.flatMap((bar, index) =>
    bar.groupLabel ? [{ index, label: bar.groupLabel }] : [],
  );
  return starts.map((start, i) => ({
    ...start,
    end: starts[i + 1]?.index ?? bars.length,
  }));
}

export function ColumnChart({
  bars,
  max,
  gridlines = [],
  height = 200,
  minWidth,
  formatCount,
}: {
  bars: ColumnBar[];
  max: number;
  gridlines?: number[];
  height?: number;
  minWidth?: number;
  formatCount?: (value: number) => string;
}) {
  const groups = getGroups(bars);
  return (
    <div className={styles.columnScroll}>
      <div className={styles.columnChart} style={{ minWidth }}>
        <div className={styles.columns} style={{ height }}>
          {gridlines.map((value) => (
            <span
              key={value}
              className={styles.gridline}
              style={{ bottom: `${(value / max) * 100}%` }}
              aria-hidden="true"
            >
              <span>{formatCount ? formatCount(value) : value}</span>
            </span>
          ))}
          {groups
            .filter((group) => group.index > 0)
            .map((group) => (
              <span
                key={group.index}
                className={styles.groupDivider}
                style={{
                  left: `calc(${columnOffset(group.index, bars.length)} - ${columnGapPx / 2}px)`,
                }}
                aria-hidden="true"
              />
            ))}
          {bars.map((bar) => {
            const total = bar.segments.reduce((sum, s) => sum + s.value, 0);
            const content = bar.segments
              .filter((segment) => segment.value > 0)
              .map((segment, index) => (
                <span
                  key={index}
                  className={toneClass[segment.tone]}
                  style={{ flexGrow: segment.value }}
                />
              ));
            const style = {
              height: total > 0 ? `${(total / max) * 100}%` : undefined,
            };
            const className = `${styles.column} ${total === 0 ? styles.columnEmpty : ""}`;
            return (
              <TooltipColumn
                key={bar.key}
                tooltip={bar.title}
                href={total > 0 ? bar.href : undefined}
                className={className}
                style={style}
              >
                {content}
              </TooltipColumn>
            );
          })}
        </div>
        <div className={styles.axis} aria-hidden="true">
          {bars.map((bar) => (
            <span
              key={bar.key}
              className={bar.highlightLabel ? styles.axisHighlight : undefined}
            >
              {bar.axisLabel && <span>{bar.axisLabel}</span>}
            </span>
          ))}
        </div>
        {groups.length > 0 && (
          <div className={styles.groupAxis} aria-hidden="true">
            {groups.map((group) => (
              <span
                key={group.index}
                style={{
                  left: columnOffset(group.index, bars.length),
                  width: `calc(${columnOffset(group.end - group.index, bars.length)} - ${columnGapPx}px)`,
                }}
              >
                {group.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export interface ProportionItem {
  key: string;
  label: ReactNode;
  count: number;
  tone: Tone;
}

export function ProportionBar({
  items,
  formatCount,
  formatShare,
}: {
  items: ProportionItem[];
  formatCount: (value: number) => string;
  formatShare: (share: number) => string;
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) return null;
  return (
    <>
      <div className={styles.proportion} aria-hidden="true">
        {items.map((item) => (
          <span
            key={item.key}
            className={toneClass[item.tone]}
            style={{ flexGrow: item.count }}
          />
        ))}
      </div>
      <ul className={styles.legend}>
        {items.map((item) => (
          <li key={item.key}>
            <span
              className={`${styles.swatch} ${toneClass[item.tone]}`}
              aria-hidden="true"
            />
            {item.label}{" "}
            <span className={styles.legendValue}>
              {formatCount(item.count)} · {formatShare(item.count / total)}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** The numbers behind a chart, for screen readers. */
export function ChartTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: ReactNode[];
  rows: (string | number)[][];
}) {
  return (
    <table className="visually-hidden">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th key={index} scope="col">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={String(row[0])}>
            {row.map((cell, index) =>
              index === 0 ? (
                <th key={index} scope="row">
                  {cell}
                </th>
              ) : (
                <td key={index}>{cell}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
