import { RelatedLarpType } from "@/generated/prisma/enums";
import { type Translations } from "@/translations/en";
import { removeRelatedLarp } from "./actions";
import SubmitButton from "../SubmitButton";

export default function RemoveRelatedLarpButton({
  locale,
  larpId,
  leftId,
  rightId,
  type,
  messages: t,
  editPolicy,
}: {
  locale: string;
  larpId: string;
  leftId: string;
  rightId: string;
  type: RelatedLarpType;
  messages: Translations["Larp"]["attributes"]["relatedLarps"]["actions"]["remove"];
  editPolicy: "VERIFIED" | "APPROVED" | "AUTO_APPROVED";
}) {
  return (
    <form
      className="d-inline ms-2"
      action={removeRelatedLarp.bind(
        null,
        locale,
        larpId,
        leftId,
        rightId,
        type,
      )}
    >
      <SubmitButton
        variant="link"
        size="sm"
        className="d-inline p-0 link-subtle text-danger"
        confirmationMessage={t.confirmationByPolicy[editPolicy]}
        title={t.title}
      >
        ❌ {t.label}
      </SubmitButton>
    </form>
  );
}
