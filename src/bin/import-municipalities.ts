import { parse, Store, Namespace, sym, Literal, Node } from "rdflib";
import { readFile } from "fs/promises";
import prisma from "@/prisma";

function byXmlLang(nodes: Node[], lang: string) {
  return nodes.find(
    (lit) => lit.termType === "Literal" && (lit as Literal).lang === lang
  )?.value;
}

interface Municipality {
  id: string;
  lat: number;
  long: number;
  nameFi: string;
  nameSv: string;
}

function parseMunicipalities(xmlContent: string): Municipality[] {
  const store = new Store();
  const baseURI = "http://www.yso.fi/onto/yso/";
  const SKOS = Namespace("http://www.w3.org/2004/02/skos/core#");
  const WGS84 = Namespace("http://www.w3.org/2003/01/geo/wgs84_pos#");
  const YSO_META = Namespace("http://www.yso.fi/onto/yso-meta/");
  parse(xmlContent, store, baseURI, "application/rdf+xml");
  const municipalityType = "http://www.wikidata.org/entity/Q113965206";

  return store
    .each(undefined, YSO_META("mmlPlaceType"), sym(municipalityType))
    .map((node) => {
      const $mun = sym(node.value);
      const labels = store.each($mun, SKOS("prefLabel"));

      // "Övertorneå (Finland)", "Lappträsk (kommun)" etc.
      const nameFi = byXmlLang(labels, "fi")?.replace(/ \(.*\)$/i, "");
      const nameSv = byXmlLang(labels, "sv")?.replace(/ \(.*\)$/i, "");
      if (!nameFi || !nameSv) {
        throw new Error(`Missing names for municipality: ${$mun.value}`);
      }

      const latStr = store.any($mun, WGS84("lat"))?.value;
      const longStr = store.any($mun, WGS84("long"))?.value;
      if (!latStr || !longStr) {
        throw new Error(`Missing coordinates for municipality: ${$mun.value}`);
      }

      return {
        id: $mun.value.replace(baseURI, "yso:"),
        lat: parseFloat(latStr),
        long: parseFloat(longStr),
        nameFi,
        nameSv,
      };
    });
}

async function storeMunicipalities(municipalities: Municipality[]) {
  for (const municipality of municipalities) {
    const result = await prisma.municipality.upsert({
      where: { id: municipality.id },
      update: {
        lat: municipality.lat,
        long: municipality.long,
        nameFi: municipality.nameFi,
        nameSv: municipality.nameSv,
      },
      create: {
        id: municipality.id,
        lat: municipality.lat,
        long: municipality.long,
        nameFi: municipality.nameFi,
        nameSv: municipality.nameSv,
      },
    });
    console.log(result);
  }
}

async function main() {
  // https://finto.fi/yso-paikat/fi/
  // https://finto.fi/rest/v1/yso-paikat/data?format=application/rdf%2Bxml
  const xmlContent = await readFile("data/yso-paikat-skos.rdf", "utf-8");
  const municipalities = parseMunicipalities(xmlContent);
  await storeMunicipalities(municipalities);
}

if (import.meta.url === "file://" + process.argv[1]) {
  main();
}
