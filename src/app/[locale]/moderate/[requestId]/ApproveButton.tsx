"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { selectionInputName } from "@/components/moderation/selection";

interface Props {
  formId: string;
  /** How many changes have a checkbox. */
  total: number;
  /** Label with every change ticked; `{count}` is replaced with the count. */
  allLabel: string;
  /** Label with some ticked; `{count}` and `{total}` are replaced. */
  someLabel: string;
  /** Whether approving with nothing ticked still does something, as creating a larp does. */
  allowNone?: boolean;
}

function countTicked(formId: string): number {
  return document.querySelectorAll(
    `input[type="checkbox"][name="${selectionInputName}"][form="${formId}"]:checked`,
  ).length;
}

/**
 * Submits the approval, saying how many of the changes ticked in the page it applies. The
 * checkboxes join the form through their `form` attribute, so they need not sit inside it.
 */
export default function ApproveButton({
  formId,
  total,
  allLabel,
  someLabel,
  allowNone = false,
}: Props) {
  const [count, setCount] = useState(total);
  const { pending } = useFormStatus();

  useEffect(() => {
    function update(event: Event) {
      const target = event.target as HTMLInputElement | null;
      if (target?.name === selectionInputName) setCount(countTicked(formId));
    }
    document.addEventListener("change", update);
    return () => document.removeEventListener("change", update);
  }, [formId]);

  const label = (count === total ? allLabel : someLabel)
    .replace("{count}", String(count))
    .replace("{total}", String(total));

  return (
    <button
      type="submit"
      name="resolution"
      value="APPROVED"
      className="btn btn-primary"
      disabled={pending || (total > 0 && count === 0 && !allowNone)}
    >
      {label}
    </button>
  );
}
