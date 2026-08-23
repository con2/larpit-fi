import { EditAction } from "@/generated/prisma/enums";
import { getLarpHref } from "@/models/Larp";
import prisma from "@/prisma";
import { FormattedDate } from "@con2/components";
import Link from "next/link";
import { CardBody, CardTitle, OverlayTrigger, Tooltip } from "react-bootstrap";
import Card from "react-bootstrap/Card";
import { CalendarAddOn, CalendarEdit } from "@con2/components/icons";
import { type Translations } from "@/translations/en";

interface Messages {
  action: Translations["ModerationRequest"]["attributes"]["action"]["choices"];
  section: Translations["HomePage"]["sections"]["recentChanges"];
}

interface RecentChange {
  resolvedAt: Date;
  action: EditAction;
  id: string;
  alias: string;
  name: string;
  isCancelled: boolean;
}

export function getRecentChanges(limit: number = 12): Promise<RecentChange[]> {
  return prisma.$queryRaw`
    select
      resolved_at as "resolvedAt",
      action,
      id,
      alias,
      name,
      is_cancelled as "isCancelled"
    from
      (
        select
          m.resolved_at,
          m.action,
          l.id,
          l.alias,
          l.name,
          l.cancelled_at is not null as is_cancelled,
          row_number () over (
            partition by l.id
            order by m.resolved_at desc nulls last
          ) as rn
        from
          moderation_request m
          join larp l on (m.larp_id = l.id)
        where
          l.openness != 'INVITE_ONLY'
          and m.status in ('APPROVED', 'AUTO_APPROVED')
          and m.action in ('CREATE', 'UPDATE')
          and m.larp_id is not null
        order by 1 desc nulls last
        limit ${10 * limit}
      )
    where
      rn = 1
    limit ${limit}
  `;
}

function EditIcon({ action }: { action: EditAction }) {
  switch (action) {
    case "CREATE":
      return <CalendarAddOn />;
    default:
      return <CalendarEdit />;
  }
}

interface Props {
  recentChanges: RecentChange[];
  locale: string;
  messages: Messages;
}

export default function RecentChangesCard({
  recentChanges,
  locale,
  messages: t,
}: Props) {
  return (
    <Card className="h-100">
      <CardBody>
        <CardTitle>{t.section.title}</CardTitle>
        {recentChanges.map((item, i) => (
          <div key={i} className="small">
            <FormattedDate locale={locale} date={item.resolvedAt} />{" "}
            <OverlayTrigger
              overlay={<Tooltip>{t.action[item.action].title}</Tooltip>}
            >
              <EditIcon action={item.action} />
            </OverlayTrigger>{" "}
            <Link
              href={getLarpHref(item)}
              className={
                item.isCancelled
                  ? "text-decoration-line-through text-muted link-subtle"
                  : "link-subtle"
              }
            >
              {item.name}
            </Link>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
