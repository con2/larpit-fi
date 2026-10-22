import { required } from "@/prisma/include";
import { Translations } from "@/translations/en";
import type { LarpPageLarp } from "../LarpPage";
import Link from "next/link";
import { getLarpHref } from "@/models/Larp";

type RelatedLarpLeft = LarpPageLarp["relatedLarpsLeft"][number];
type RelatedLarpRight = LarpPageLarp["relatedLarpsRight"][number];

export function LeftRelatedLarpComponent({
  relatedLarp,
  messages: t,
  children,
}: {
  relatedLarp: RelatedLarpLeft;
  messages: Translations["Larp"];
  children?: React.ReactNode;
}) {
  const right = required(relatedLarp.right);
  return (
    <div>
      {t.attributes.leftRelatedLarps.types[relatedLarp.type] ||
        relatedLarp.type}{" "}
      <Link href={getLarpHref(right)} className="link-subtle">
        {right.name}
      </Link>
      {children}
    </div>
  );
}

export function RightRelatedLarpComponent({
  relatedLarp,
  messages: t,
  children,
}: {
  relatedLarp: RelatedLarpRight;
  messages: Translations["Larp"];
  children?: React.ReactNode;
}) {
  const left = required(relatedLarp.left);
  return (
    <div>
      <Link href={getLarpHref(left)} className="link-subtle">
        {left.name}
      </Link>{" "}
      {t.attributes.rightRelatedLarps.types[relatedLarp.type] ||
        relatedLarp.type}
      {children}
    </div>
  );
}
