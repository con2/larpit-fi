import { LarpBasicInfoFormComponent } from "@/components/LarpBasicInfoFormComponent";
import LarpLocationFormComponent from "@/components/LarpLocationFormComponent";
import { LarpPageContentFormComponent } from "@/components/LarpPageContentFormComponent";
import { LarpSignupInfoFormComponent } from "@/components/LarpSignupInfoFormComponent";
import { LarpTimeFormComponent } from "@/components/LarpTimeFormComponent";
import { Larp } from "@/generated/prisma";
import type { Translations } from "@/translations/en";

interface Props {
  translations: Translations;
  locale: string;
  larp: Omit<Larp, "id" | "updatedAt" | "alias"> | null;
  readOnly?: boolean;
  compact?: boolean;
}

export default function LarpFormComponent({
  translations,
  locale,
  larp,
  readOnly,
  compact,
}: Props) {
  return (
    <>
      <LarpBasicInfoFormComponent
        translations={translations}
        locale={locale}
        larp={larp}
        readOnly={readOnly}
        compact={compact}
      />
      <LarpTimeFormComponent
        translations={translations}
        locale={locale}
        larp={larp}
        readOnly={readOnly}
        compact={compact}
      />
      <LarpLocationFormComponent
        translations={translations}
        locale={locale}
        larp={larp}
        readOnly={readOnly}
        compact={compact}
      />
      <LarpSignupInfoFormComponent
        translations={translations}
        locale={locale}
        larp={larp}
        readOnly={readOnly}
        compact={compact}
      />
      <LarpPageContentFormComponent
        translations={translations}
        locale={locale}
        larp={larp}
        readOnly={readOnly}
        compact={compact}
      />
    </>
  );
}
