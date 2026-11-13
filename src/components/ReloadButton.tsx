"use client";

export default function ReloadButton({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.location.reload()}
    >
      {label}
    </button>
  );
}
