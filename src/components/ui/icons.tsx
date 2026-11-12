import type { SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number };

function Icon({
  size = 16,
  viewBox = "0 0 16 16",
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5 L14 14" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 14 14" strokeWidth={2} {...props}>
      <path d="M7 1v12M1 7h12" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 14 14" strokeWidth={1.8} {...props}>
      <path d="M1 3h12M1 7h12M1 11h12" />
    </Icon>
  );
}

export const ListIcon = MenuIcon;

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 12 12" strokeWidth={1.8} size={12} {...props}>
      <path d="M2 4 L6 8 L10 4" />
    </Icon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 18 18" {...props}>
      <rect x="2" y="3" width="14" height="13" rx="2" />
      <path d="M2 7 H16 M6 1.5 V4 M12 1.5 V4" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 18 18" strokeWidth={1.8} {...props}>
      <path d="M3 9.5 L7 13.5 L15 5" />
    </Icon>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 18 18" {...props}>
      <path d="M9 15.5 L2.8 9.3 A3.6 3.6 0 0 1 9 4.6 A3.6 3.6 0 0 1 15.2 9.3 Z" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5 V8 L10.5 9.5" />
    </Icon>
  );
}

export function FolderIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 4 H6 L7.5 5.5 H14 V13 H2 Z" />
    </Icon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="5.5" r="3" />
      <path d="M2.5 14 C3 10.5 13 10.5 13.5 14" />
    </Icon>
  );
}

export function ExternalIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 18 18" {...props}>
      <path d="M5 13 L13 5 M7 5 H13 V11" />
    </Icon>
  );
}

export function SignOutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 2 H3 V14 H6 M10 11 L13.5 8 L10 5 M13 8 H6" />
    </Icon>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 9.5 L9.5 6.5 M4 10 L3 11 A2.5 2.5 0 0 0 5 15 L6 14 M12 6 L13 5 A2.5 2.5 0 0 0 11 1 L10 2" />
    </Icon>
  );
}

export function EditIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M11 2.5 L13.5 5 L5.5 13 H3 V10.5 Z" />
    </Icon>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 4 H13.5 M6 4 V2.5 H10 V4 M4 4 L4.8 14 H11.2 L12 4 M6.8 7 V11.5 M9.2 7 V11.5" />
    </Icon>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <circle cx="5.8" cy="6.5" r="1.2" />
      <path d="M2.5 12 L6.5 8.5 L9 10.5 L11 9 L13.5 11" />
    </Icon>
  );
}

export function ZoomIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.5 2.5 H13.5 V6.5 M13.5 2.5 L9 7 M6.5 13.5 H2.5 V9.5 M2.5 13.5 L7 9" />
    </Icon>
  );
}

export function RelatedIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="4" cy="8" r="2.2" />
      <circle cx="12" cy="4" r="2.2" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M6 7 L10 5 M6 9 L10 11" />
    </Icon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 2 L13 4 V8 C13 11 10.5 13 8 14 C5.5 13 3 11 3 8 V4 Z" />
    </Icon>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 2 V10 M4.5 6.5 L8 10 L11.5 6.5 M3 13 H13" />
    </Icon>
  );
}

export function StatsIcon(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <path d="M2 13 V8 M6.5 13 V4 M11 13 V6.5 M15 13 H1" />
    </Icon>
  );
}

export function ThemeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 2 A6 6 0 0 1 8 14 Z" fill="currentColor" />
    </Icon>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="6.2" />
      <path d="M1.8 8 H14.2 M8 1.8 C5.8 4 5.8 12 8 14.2 M8 1.8 C10.2 4 10.2 12 8 14.2" />
    </Icon>
  );
}

export function TodayIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 18 18" {...props}>
      <rect x="2" y="3" width="14" height="13" rx="2" />
      <path d="M2 7 H16" />
      <circle cx="9" cy="11.5" r="1.5" fill="currentColor" />
    </Icon>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 2 L13 4 V8 C13 11 10.5 13 8 14 C5.5 13 3 11 3 8 V4 Z" />
      <path d="M5.8 8 L7.4 9.6 L10.4 6.6" />
    </Icon>
  );
}

export function PagesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 2 H10 L13 5 V14 H4 Z M10 2 V5 H13" />
    </Icon>
  );
}
