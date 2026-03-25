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
  return (
    <div>
      {t.attributes.leftRelatedLarps.types[relatedLarp.type] ||
        relatedLarp.type}{" "}
      <Link href={getLarpHref(relatedLarp.right)} className="link-subtle">
        {relatedLarp.right?.name}
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
  return (
    <div>
      <Link href={getLarpHref(relatedLarp.left)} className="link-subtle">
        {relatedLarp.left?.name}
      </Link>{" "}
      {t.attributes.rightRelatedLarps.types[relatedLarp.type] ||
        relatedLarp.type}
      {children}
    </div>
  );
}
