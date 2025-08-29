import prisma from "@/prisma";

const query = `
SELECT DISTINCT ?country ?countryLabel_en ?countryLabel_fi ?countryLabel_sv ?iso2 WHERE {
  ?country wdt:P31/wdt:P279* wd:Q3624078.  # sovereign states
  OPTIONAL { ?country wdt:P297 ?iso2. }     # ISO 3166-1 alpha-2 code

  # Get labels in specific languages
  ?country rdfs:label ?countryLabel_en FILTER(LANG(?countryLabel_en) = "en").
  ?country rdfs:label ?countryLabel_fi FILTER(LANG(?countryLabel_fi) = "fi").
  OPTIONAL { ?country rdfs:label ?countryLabel_sv FILTER(LANG(?countryLabel_sv) = "sv"). }

  # Filter out historical countries
  FILTER NOT EXISTS { ?country wdt:P576 ?dissolved. }
  FILTER NOT EXISTS { ?country wdt:P582 ?endTime. }
}
ORDER BY ?countryLabel_en
`;

async function getCountryData() {
  const url = "https://query.wikidata.org/sparql";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "larpit-fi-import/1.0 (https://github.com/con2/larpit-fi)",
    },
    body: `query=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

interface Country {
  id: string;
  code: string | null;
  nameEn: string;
  nameFi: string;
  nameSv: string | null;
}

function parseCountryData(data: any) {
  const countries: Country[] = [];

  for (const item of data.results.bindings) {
    const id = "wd:" + item.country.value.split("/").pop(); // FI = wd:Q33
    const nameEn = item.countryLabel_en.value;
    const nameFi = item.countryLabel_fi.value;
    const nameSv = item.countryLabel_sv?.value ?? null;
    const code = item.iso2?.value;
    if (!code || !nameFi) continue;
    countries.push({ id, code, nameEn, nameFi, nameSv });
  }

  return countries;
}

async function storeCountries(countries: Country[]) {
  for (const country of countries) {
    const { id, code, nameFi, nameEn, nameSv } = country;
    const result = await prisma.country.upsert({
      where: {
        id,
      },
      create: {
        id,
        code,
        nameEn,
        nameFi,
        nameSv,
      },
      update: {
        nameEn,
        nameFi,
        nameSv,
      },
    });
    console.log(result);
  }
}

async function main() {
  const data = await getCountryData();
  const countries = parseCountryData(data);
  await storeCountries(countries);
}

if (import.meta.url === "file://" + process.argv[1]) {
  main();
}
