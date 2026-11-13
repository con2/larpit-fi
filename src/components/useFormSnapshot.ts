"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

interface MissingField {
  /** Id of the element to focus: the input itself, or the first radio of a group. */
  id: string;
  label: string;
  sectionId: string | null;
}

export interface FormSnapshot {
  values: Record<string, string>;
  /** Visible text of the selected option of each select, by field name. */
  selectedText: Record<string, string>;
  missing: MissingField[];
  /** Ids of the sections that contain at least one required field. */
  sectionsWithRequired: string[];
}

type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function isField(element: Element): element is FieldElement {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  );
}

function textWithoutRequiredMark(element: Element): string {
  const clone = element.cloneNode(true) as Element;
  clone.querySelectorAll("[data-required-mark]").forEach((mark) => {
    mark.remove();
  });
  return (clone.textContent ?? "").replace(/\s+/g, " ").trim();
}

function fieldLabel(form: HTMLFormElement, field: FieldElement): string {
  const explicit = field.dataset.requiredLabel ?? field.ariaLabel;
  if (explicit) return explicit;
  if (field instanceof HTMLInputElement && field.type === "radio") {
    const legend = field.closest("fieldset")?.querySelector("legend");
    if (legend) return textWithoutRequiredMark(legend);
  }
  const label = field.id
    ? form.querySelector(`label[for="${CSS.escape(field.id)}"]`)
    : null;
  if (label) return textWithoutRequiredMark(label);
  return field.name;
}

function readForm(form: HTMLFormElement): FormSnapshot {
  const values: Record<string, string> = {};
  for (const [key, value] of new FormData(form).entries()) {
    if (typeof value === "string") values[key] = value;
  }

  const selectedText: Record<string, string> = {};
  const missing: MissingField[] = [];
  const sectionsWithRequired = new Set<string>();
  const seenRadioGroups = new Set<string>();

  for (const element of Array.from(form.elements)) {
    if (!isField(element)) continue;

    if (element instanceof HTMLSelectElement && element.name) {
      selectedText[element.name] = element.selectedOptions[0]?.text ?? "";
    }

    if (!element.required || element.disabled) continue;
    const sectionId = element.closest("section[id]")?.id ?? null;
    if (sectionId) sectionsWithRequired.add(sectionId);

    const isRadio =
      element instanceof HTMLInputElement && element.type === "radio";
    if (isRadio) {
      if (seenRadioGroups.has(element.name)) continue;
      seenRadioGroups.add(element.name);
    }

    if (element.validity.valueMissing) {
      missing.push({
        id: element.id,
        label: fieldLabel(form, element),
        sectionId,
      });
    }
  }

  return {
    values,
    selectedText,
    missing,
    sectionsWithRequired: Array.from(sectionsWithRequired),
  };
}

/**
 * Current values and empty required fields of a form, updated as the user types. Null until
 * hydration, so the server render and the first client render agree.
 */
export function useFormSnapshot(
  findForm: () => HTMLFormElement | null,
): FormSnapshot | null {
  const cache = useRef<{ key: string; snapshot: FormSnapshot } | null>(null);

  const subscribe = useCallback(
    (onChange: () => void) => {
      const form = findForm();
      if (!form) return () => {};
      form.addEventListener("input", onChange);
      form.addEventListener("change", onChange);
      const observer = new MutationObserver(onChange);
      observer.observe(form, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["required", "disabled"],
      });
      return () => {
        form.removeEventListener("input", onChange);
        form.removeEventListener("change", onChange);
        observer.disconnect();
      };
    },
    [findForm],
  );

  const getSnapshot = useCallback(() => {
    const form = findForm();
    if (!form) return null;
    const snapshot = readForm(form);
    const key = JSON.stringify(snapshot);
    if (cache.current?.key !== key) cache.current = { key, snapshot };
    return cache.current.snapshot;
  }, [findForm]);

  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export function focusField(id: string) {
  const element = document.getElementById(id);
  if (!element) return false;
  element.scrollIntoView({ block: "center", behavior: "smooth" });
  element.focus({ preventScroll: true });
  return true;
}
