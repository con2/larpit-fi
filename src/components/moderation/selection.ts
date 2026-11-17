import type {
  ApprovalSelection,
  ChangeListKey,
  ModerationRequestContent,
} from "@/models/ModerationRequest";

/**
 * Name of the checkboxes that pick the changes to approve. Their values are `fields:<key>`,
 * `<list>:<index>` such as `addLinks:0`, and `role`.
 */
export const selectionInputName = "select";

const listKeys: ChangeListKey[] = [
  "addLinks",
  "removeLinks",
  "addTags",
  "removeTags",
  "addRelatedLarps",
  "removeRelatedLarps",
];

export function parseApprovalSelection(values: string[]): ApprovalSelection {
  const selection: ApprovalSelection = {
    fields: [],
    addLinks: [],
    removeLinks: [],
    addTags: [],
    removeTags: [],
    addRelatedLarps: [],
    removeRelatedLarps: [],
    role: false,
  };
  for (const value of values) {
    if (value === "role") {
      selection.role = true;
      continue;
    }
    const [kind, item] = value.split(":", 2);
    if (kind === "fields" && item) {
      selection.fields.push(item as keyof ModerationRequestContent);
    } else if ((listKeys as string[]).includes(kind) && /^\d+$/.test(item)) {
      selection[kind as ChangeListKey].push(Number(item));
    }
  }
  return selection;
}
