"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import classes from "./DimensionFilters.module.css";

export interface DimensionValue {
  slug: string;
  title: string;
}

export interface Dimension {
  slug: string;
  title: string;
  values: DimensionValue[];
}

interface Props {
  className?: string;
  search?: boolean;
  dimensions: Dimension[];
  messages?: {
    searchPlaceholder?: string;
    filter?: string;
  };
}

/// Presents the dimensions as dropdowns.
/// Updates the search params when the user selects a value.
/// Can be used in all use cases that follow the dimension pattern.
/// Gracefully degrades to showing a submit button when JavaScript is disabled.
export function DimensionFilters(props: Props) {
  const { dimensions, search, messages } = props;
  const searchParams = useSearchParams();
  const searchTerm = search ? (searchParams.get("search") ?? "") : "";
  const { replace } = useRouter();

  const onChange = useCallback(
    (
      event:
        | React.ChangeEvent<HTMLSelectElement>
        | React.FocusEvent<HTMLInputElement>
    ) => {
      // update searchParams and navigate to it
      const { name, value } = event.target;
      const newSearchParams = new URLSearchParams(searchParams);

      if (value === "") {
        newSearchParams.delete(name);
      } else {
        newSearchParams.set(name, value);
      }

      const url = new URL(location.href);
      url.search = newSearchParams.toString();
      replace(url.toString());
    },
    [searchParams, replace]
  );

  // For clients with JavaScript, do a soft navigation on submit.
  // Clients without JavaScript still degrade gracefully to a full page reload.
  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const newSearchParams = new URLSearchParams(searchParams);

      for (const element of form.elements as any) {
        if (element.name && element.value) {
          newSearchParams.set(element.name, element.value);
        } else {
          newSearchParams.delete(element.name);
        }
      }

      const url = new URL(location.href);
      url.search = newSearchParams.toString();
      replace(url.toString());
    },
    [searchParams, replace]
  );

  const className = `row row-cols-md-auto g-3 align-items-center mt-1 mb-2 ${
    props.className ?? ""
  }`;

  return (
    <form className={className} onSubmit={onSubmit}>
      {dimensions.map((dimension) => {
        const dimensionTitle = dimension.title ?? dimension.slug;

        // If the caller has not provided their own "nothing" value, invent one.
        const choices = dimension.values.slice();
        if (!choices.find((choice) => choice.slug === "")) {
          const nothing: DimensionValue = {
            slug: "",
            title: `${dimensionTitle}...`,
          };
          choices.unshift(nothing);
        }

        const inputId = `dimension-${dimension.slug}`;
        const selectedSlug = searchParams.get(dimension.slug) ?? "";

        return (
          <div className="col-12" key={dimension.slug}>
            <label className="visually-hidden" htmlFor={inputId}>
              {dimension.title}
            </label>
            <select
              name={dimension.slug}
              id={inputId}
              className={`form-select form-select-sm border-secondary-subtle ${classes.dimensionFilter}`}
              defaultValue={selectedSlug}
              onChange={onChange}
            >
              {choices.map((choice) => (
                <option
                  key={choice.slug ?? "__empty_choice"}
                  value={choice.slug}
                >
                  {choice.title}
                </option>
              ))}
            </select>
          </div>
        );
      })}
      {search && (
        <div className="col-12">
          <input
            className={`form-control form-control-sm border-secondary-subtle ${classes.searchTerm}`}
            defaultValue={searchTerm}
            placeholder={
              messages?.searchPlaceholder && messages.searchPlaceholder + "…"
            }
            onBlur={onChange}
            name="search"
          />
        </div>
      )}
      <noscript>
        <button type="submit" className="btn btn-sm btn-primary">
          {messages?.filter || "Submit"}
        </button>
      </noscript>
    </form>
  );
}
