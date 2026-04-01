import fsp from "fs/promises";
import prisma from "@/prisma";

const holidayFiToEn: Record<string, string> = {
  Uudenvuodenpäivä: "New Year's Day",
  Loppiainen: "Epiphany",
  Pitkäperjantai: "Good Friday",
  Pääsiäispäivä: "Easter Sunday",
  "2. pääsiäispäivä": "Easter Monday",
  Vappu: "May Day",
  Äitienpäivä: "Mother's Day",
  Helatorstai: "Maundy Thursday",
  Helluntai: "Pentecost",
  Juhannusaatto: "Midsummer's Eve",
  Juhannuspäivä: "Midsummer's Day",
  Isänpäivä: "Father's Day",
  Pyhäinpäivä: "All Saints' Day",
  Itsenäisyyspäivä: "Independence Day",
  Jouluaatto: "Christmas Eve",
  Joulupäivä: "Christmas Day",
  Tapaninpäivä: "Boxing Day",
};

async function main() {
  const data: { date: string; title: string }[] = JSON.parse(
    await fsp.readFile("data/holidays.json", "utf-8"),
  );

  await prisma.holiday.createMany({
    data: data.map(({ date, title }) => ({
      date: new Date(date),
      titleFi: title,
      titleEn: holidayFiToEn[title],
    })),
  });
}

if (import.meta.url === "file://" + process.argv[1]) {
  main();
}
