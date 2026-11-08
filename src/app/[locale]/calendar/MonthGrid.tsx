import { Temporal } from "@js-temporal/polyfill";
import type { CSSProperties } from "react";

import type { Translations } from "@/translations/en";

import CalendarBar, { CalendarLarp } from "./CalendarBar";
import { layoutWeek, minLanesPerWeek } from "./calendarLayout";
import styles from "./calendar.module.scss";

interface Props {
  larps: CalendarLarp[];
  mondays: Temporal.PlainDate[];
  month: Temporal.PlainYearMonth;
  today: Temporal.PlainDate;
  holidayTitles: Map<string, string>;
  locale: string;
  messages: Translations["CalendarPage"];
  pillMessages: Translations["CommandPalette"]["pill"];
}

export default function MonthGrid({
  larps,
  mondays,
  month,
  today,
  holidayTitles,
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
        const layout = layoutWeek(larps, monday);
        const lanes = Math.max(minLanesPerWeek, layout.laneCount);

        return (
          <div
            key={monday.toString()}
            className={`${styles.columns} ${styles.week}`}
            style={{ "--lanes": lanes } as CSSProperties}
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
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  gridColumn: `${bar.startColumn + 1} / ${bar.endColumn + 1}`,
                  gridRow: bar.lane + 2,
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
