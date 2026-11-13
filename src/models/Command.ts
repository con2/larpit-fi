import { supportedLanguages } from "@/i18n/locales";
import { execute, sql } from "@/prisma/sql";
import { getTranslations } from "@/translations";
import type { Translations } from "@/translations/en";

type CommandLabelKey = keyof Translations["CommandPalette"]["commands"];

/**
 * Commands that the palette implements, by action. The palette matches search hits to its
 * commands by these actions, so renaming one needs the same change in `CommandPalette.tsx`,
 * `LarpPage.tsx` or `calendar/page.tsx`. Labels after the first are searchable as synonyms.
 */
const builtinCommandLabels: Record<string, CommandLabelKey[]> = {
  "global:addLarp": ["addLarp"],
  "global:calendar": ["calendar"],
  "global:allLarps": ["allLarps"],
  "global:stats": ["stats"],
  "global:theme": ["themeToNight", "themeToDay"],
  "global:language": ["switchLanguage"],
  "larp:editLarp": ["editLarp"],
  "larp:addRelated": ["addRelated"],
  "larp:copyLink": ["copyLink"],
  "larp:share": ["share"],
  "larp:claim": ["claim"],
  "larp:headerImage": ["headerImage"],
  "larp:addToCalendar": ["addToCalendar"],
  "larp:mergeDuplicate": ["mergeDuplicate"],
  "calendar:subscribe": ["subscribe"],
  "calendar:jumpToToday": ["jumpToToday"],
};

export interface BuiltinCommand {
  language: string;
  action: string;
  label: string;
  synonyms: string;
}

export function getBuiltinCommands(): BuiltinCommand[] {
  return supportedLanguages.flatMap((language) => {
    const t = getTranslations(language).CommandPalette;
    return Object.entries(builtinCommandLabels).map(
      ([action, [labelKey, ...otherLabelKeys]]) => ({
        language,
        action,
        label: t.commands[labelKey],
        synonyms: [
          ...otherLabelKeys.map((key) => t.commands[key]),
          ...(t.commandSynonyms[action] ?? []),
        ].join("\n"),
      }),
    );
  });
}

/**
 * Writes the built-in commands from the translations and removes built-in commands that no
 * longer exist. Commands added by an admin (`is_builtin = false`) are left alone, unless one has
 * the language and action of a built-in command, which then takes it over.
 */
export async function ensureBuiltinCommands(
  commands: BuiltinCommand[] = getBuiltinCommands(),
): Promise<void> {
  const column = (key: keyof BuiltinCommand) => commands.map((c) => c[key]);
  await execute(sql`
    insert into command (language, action, label, synonyms, is_builtin)
    select language, action, label, synonyms, true
    from unnest(
      ${column("language")}::text[],
      ${column("action")}::text[],
      ${column("label")}::text[],
      ${column("synonyms")}::text[]
    ) as builtin(language, action, label, synonyms)
    on conflict (language, action) do update
    set label = excluded.label, synonyms = excluded.synonyms, is_builtin = true
  `);
  await execute(sql`
    delete from command
    where
      is_builtin
      and (language, action) not in (
        select * from unnest(${column("language")}::text[], ${column("action")}::text[])
      )
  `);
}
