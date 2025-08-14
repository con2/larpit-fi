import { Larp } from "@/generated/prisma";

export default function getLarpHref(larp: Pick<Larp, "id" | "alias">): string {
  return larp.alias ? `/${larp.alias}` : `/larp/${larp.id}`;
}
