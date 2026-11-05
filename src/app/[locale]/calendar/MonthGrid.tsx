import { Temporal } from "@js-temporal/polyfill";

import { formatShortDateRange } from "@/helpers/dates";
import type { Translations } from "@/translations/en";

import CalendarBar, { CalendarLarp } from "./CalendarBar";
import { layoutWeek, visibleLanesPerWeek } from "./calendarLayout";
import styles from "./calendar.module.scss";
import {
  ExpandableWeek,
  WeekExpansionToggle,
  WhenExpanded,
} from "./ExpandableWeek";

interface Props {
  larps: CalendarLarp[];
  mondays: Temporal.PlainDate[];
  month: Temporal.PlainYearMonth;
  today: Temporal.PlainDate;
  holidayTitles: Map<string, string>;
  expandedWeek: string | null;
  /** This page scrolled to the week of `monday`, which is expanded or not; for browsers without JavaScript. */
  weekHref: (monday: Temporal.PlainDate, expanded: boolean) => string;
  locale: string;
  messages: Translations["CalendarPage"];
  pillMessages: Translations["CommandPalette"]["pill"];
}

export function weekId(monday: Temporal.PlainDate) {
  return `week-${monday.toString()}`;
}

export default function MonthGrid({
  larps,
  mondays,
  month,
  today,
  holidayTitles,
  expandedWeek,
  weekHref,
  locale,
  messages: t,
  pillMessages,
}: Props) {
  return (
    <div className={styles.grid}>
      <div className={`${styles.columns} ${styles.weekdays}`}>
        <div className={styles.weekNumberHeader}>
          <abbr title={t.weekNumberTitle}>{t.weekNumber}</abbr>
        </div>
        {t.weekdaysShort.map((name, index) => (
          <div
            key={name}
            className={`${styles.weekday}${index >= 5 ? ` ${styles.weekendHeader}` : ""}`}
          >
            {name}
          </div>
        ))}
      </div>

      {mondays.map((monday) => {
        const id = weekId(monday);
        const layout = layoutWeek(larps, monday);
        const expandable = layout.laneCount > visibleLanesPerWeek;

        return (
          <ExpandableWeek
            key={id}
            id={id}
            className={`${styles.columns} ${styles.week}`}
            laneCount={layout.laneCount}
            initiallyExpanded={expandable && expandedWeek === id}
          >
            <div className={styles.weekNumber}>{monday.weekOfYear}</div>

            {Array.from({ length: 7 }, (_, index) => {
              const date = monday.add({ days: index });
              const holidayTitle = holidayTitles.get(date.toString());
              const isToday = Temporal.PlainDate.compare(date, today) === 0;
              const inMonth =
                date.year === month.year && date.month === month.month;
              return (
                <div
                  key={index}
                  className={[
                    styles.day,
                    index >= 5 && styles.weekend,
                    index === 6 && styles.sunday,
                    !inMonth && styles.otherMonth,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ gridColumn: index + 2 }}
                >
                  <span
                    className={isToday ? styles.todayNumber : styles.dayNumber}
                    aria-current={isToday ? "date" : undefined}
                  >
                    {date.day}
                    {isToday && (
                      <span className="visually-hidden">, {t.today}</span>
                    )}
                  </span>
                  {holidayTitle && (
                    <span className={styles.holiday} title={holidayTitle}>
                      {holidayTitle}
                    </span>
                  )}
                </div>
              );
            })}

            {layout.bars.map((bar) => (
              <CalendarBar
                key={bar.item.id}
                larp={bar.item}
                locale={locale}
                messages={pillMessages}
                className={[
                  bar.continuesBefore && styles.continuesBefore,
                  bar.continuesAfter && styles.continuesAfter,
                  bar.lane >= visibleLanesPerWeek && styles.collapsed,
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  gridColumn: `${bar.startColumn + 1} / ${bar.endColumn + 1}`,
                  gridRow: bar.lane + 2,
                }}
              />
            ))}

            {expandable && (
              <>
                <WhenExpanded expanded={false}>
                  {layout.hiddenCountByDay.map((count, index) => {
                    if (count === 0) return null;
                    const date = monday.add({ days: index });
                    return (
                      <div
                        key={index}
                        className={styles.moreCell}
                        style={{ gridColumn: index + 2 }}
                      >
                        <WeekExpansionToggle
                          expand
                          href={weekHref(monday, true)}
                          className={styles.moreButton}
                          label={t.moreLabel
                            .replace("{count}", String(count))
                            .replace(
                              "{date}",
                              `${t.weekdaysShort[index]} ${formatShortDateRange(date, null, locale)}`,
                            )}
                        >
                          {t.more.replace("{count}", String(count))}
                        </WeekExpansionToggle>
                      </div>
                    );
                  })}
                </WhenExpanded>
                <WhenExpanded expanded>
                  <div className={styles.fewerCell}>
                    <WeekExpansionToggle
                      expand={false}
                      href={weekHref(monday, false)}
                      className={styles.moreButton}
                    >
                      {t.showFewer}
                    </WeekExpansionToggle>
                  </div>
                </WhenExpanded>
              </>
            )}
          </ExpandableWeek>
        );
      })}
    </div>
  );
}
