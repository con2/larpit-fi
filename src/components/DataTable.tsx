import { Fragment, ReactNode } from "react";
import MaybeExternalLink from "./MaybeExternalLink";

type Responsive = "sm" | "md" | "lg" | "xl" | boolean;

export interface Column<Row> {
  slug: string;
  title: ReactNode;
  getCellElement?: (row: Row, children?: ReactNode) => ReactNode;
  getCellContents?: (row: Row) => ReactNode;
  getHeaderElement?: (children?: ReactNode) => ReactNode;
  getHeaderContents?: () => ReactNode;
  getHref?: (row: Row) => string | undefined;
  className?: string;
  scope?: string;
}

function ResponsiveWrapper({
  responsive,
  children,
}: {
  responsive?: Responsive;
  children?: ReactNode;
}) {
  switch (responsive) {
    case "sm":
    case "md":
    case "lg":
    case "xl":
      return <div className={`table-responsive-${responsive}`}>{children}</div>;
    case true:
      return <div className="table-responsive">{children}</div>;
    default:
      return <>{children}</>;
  }
}

interface DataTableProps<Row> {
  className?: string;
  rows: Row[];
  columns: Column<Row>[];
  getTotalMessage?: (total: number) => ReactNode;
  /// NOTE: Do not mix getRowHref and a custom getCellElement (or implement the .link-stretched logic in getCellElement yourself)
  getRowHref?: (row: Row) => string | undefined;
  responsive?: Responsive;
  children?: ReactNode;
}

function defaultCellElement<Row>(
  this: Column<Row>,
  _row: Row,
  children?: ReactNode
) {
  const href = this.getHref?.(_row);
  if (href) {
    children = (
      <MaybeExternalLink href={href} className="stretched-link link-xxsubtle">
        {children}
      </MaybeExternalLink>
    );
  }

  // XXX here be dragons
  // For .stretched-link to not leak outside the table, it needs a non-static positioned parent
  const style = this.getHref ? ({ position: "relative" } as const) : undefined;

  if (this.scope === "row") {
    return (
      <th scope={this.scope} className={this.className} style={style}>
        {children}
      </th>
    );
  } else {
    return (
      <td scope={this.scope} className={this.className} style={style}>
        {children}
      </td>
    );
  }
}

function defaultCellContents<Row>(this: Column<Row>, row: Row) {
  const value = (row as any)[this.slug];

  if (typeof value === "undefined" || value === null) {
    return "";
  }

  return <>{"" + value}</>;
}

function defaultHeaderElement<Row>(this: Column<Row>, children?: ReactNode) {
  return (
    <th key={this.slug} scope="col" className={this.className}>
      {children}
    </th>
  );
}

function defaultHeaderContents<Row>(this: Column<Row>) {
  return this.title;
}

export function DataTable<Row>(props: DataTableProps<Row>) {
  const { rows, getTotalMessage, responsive, children, getRowHref } = props;

  const columns: Column<Row>[] = props.columns.map((column) => ({
    getCellElement: column.getCellElement ?? defaultCellElement,
    getCellContents: column.getCellContents ?? defaultCellContents,
    getHeaderElement: column.getHeaderElement ?? defaultHeaderElement,
    getHeaderContents: column.getHeaderContents ?? defaultHeaderContents,
    getHref: column.getHref ?? getRowHref,
    className: "align-middle",
    ...column,
  }));

  const totalMessage = getTotalMessage?.(props.rows.length);
  let className = props.className ?? "table table-striped";
  if (getRowHref) {
    className += " table-hover";
  }

  return (
    <ResponsiveWrapper responsive={responsive}>
      <table className={className}>
        <thead>
          <tr>
            {columns.map((column) => (
              <Fragment key={column.slug}>
                {column.getHeaderElement!(column!.getHeaderContents!())}
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {columns.map((column) => (
                <Fragment key={column.slug}>
                  {column.getCellElement!(row, column.getCellContents!(row))}
                </Fragment>
              ))}
            </tr>
          ))}
        </tbody>
        {children}
      </table>
      {totalMessage && <p>{totalMessage}</p>}
    </ResponsiveWrapper>
  );
}
