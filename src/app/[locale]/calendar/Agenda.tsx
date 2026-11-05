import { Temporal } from "@js-temporal/polyfill";

import { formatShortDateRange } from "@/helpers/dates";
import type { Translations } from "@/translations/en";

import CalendarBar, { CalendarLarp } from "./CalendarBar";
import { buildAgenda, endsWithinWeek } from "./calendarLayout";
import styles from "./calendar.module.scss";

interface Props {
  larps: CalendarLarp[];
  month: Temporal.PlainYearMonth;
  today: Temporal.PlainDate;
  holidayTitles: Map<string, string>;
  subscribeHref: string;
  locale: string;
  messages: Translations["CalendarPage"];
  pillMessages: Translations["CommandPalette"]["pill"];
}

export default function Agenda({
  larps,
  month,
  today,
  holidayTitles,
  subscribeHref,
  locale,
  messages: t,
  pillMessages,
}: Props) {
  const weeks = buildAgenda(
    larps,
    month.toPlainDate({ day: 1 }),
    month.toPlainDate({ day: month.daysInMonth }),
  );

  function endMarker(listedOn: Temporal.PlainDate, endsOn: Temporal.PlainDate) {
    return endsWithinWeek(listedOn, endsOn)
      ? t.weekdaysShort[endsOn.dayOfWeek - 1]
      : formatShortDateRange(endsOn, null, locale);
  }

  const weeksWithLarps = weeks.filter((week) => week.days.length > 0);

  return (
    <div className={styles.agenda}>
      {weeksWithLarps.length === 0 && (
        <p className={styles.agendaEmpty}>{t.noLarps}</p>
      )}
      {weeksWithLarps.map((week) => (
        <section
          key={week.monday.toString()}
          aria-labelledby={`agenda-${week.monday}`}
        >
          <h2 className={styles.agendaWeekHeading} id={`agenda-${week.monday}`}>
            <span className={styles.agendaWeekTitle}>
              {t.week(week.monday.weekOfYear ?? 0)}
            </span>
            <span className={styles.agendaWeekRange}>
              {formatShortDateRange(week.monday, week.sunday, locale)}
            </span>
          </h2>
          {week.days.map((day) => {
            const holidayTitle = holidayTitles.get(day.date.toString());
            const isToday = Temporal.PlainDate.compare(day.date, today) === 0;
            return (
              <div key={day.date.toString()} className={styles.agendaDay}>
                <div
                  className={`${styles.agendaDate}${isToday ? ` ${styles.agendaToday}` : ""}`}
                >
                  <span className={styles.agendaWeekday}>
                    {t.weekdaysShort[day.date.dayOfWeek - 1]}
                  </span>
                  <span
                    className={styles.agendaDayNumber}
                    aria-current={isToday ? "date" : undefined}
                  >
                    {day.date.day}
                    {isToday && (
                      <span className="visually-hidden">, {t.today}</span>
                    )}
                  </span>
                  {holidayTitle && (
                    <span className={styles.agendaHoliday}>{holidayTitle}</span>
                  )}
                </div>
                <ul className={styles.agendaEntries}>
                  {day.entries.map(({ item, endsOn }) => (
                    <li key={item.id}>
                      <CalendarBar
                        larp={item}
                        locale={locale}
                        messages={pillMessages}
                        className={styles.agendaBar}
                        trailing={
                          endsOn && (
                            <span
                              className={styles.endMarker}
                              aria-hidden="true"
                            >
                              → {endMarker(day.date, endsOn)}
                            </span>
                          )
                        }
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      ))}
      <div className={styles.agendaFooter}>
        <span>{t.agendaFooter}</span>
        <a href={subscribeHref}>{t.subscribe.button} →</a>
      </div>
    </div>
  );
}
