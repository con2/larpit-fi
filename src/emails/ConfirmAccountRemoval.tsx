import { formattedMailFrom, privacyPolicyUrl, publicUrl } from "@/config";
import { toSupportedLanguage } from "@/translations";
import {
  Button,
  Container,
  Hr,
  Html,
  Link,
  Text,
} from "@react-email/components";
import * as React from "react";

const signatureSeparator = "-- ";

export function confirmAccountRemovalSubject(locale: string) {
  locale = toSupportedLanguage(locale);

  switch (locale) {
    case "fi":
      return "Larpit.fi: Vahvista käyttäjätilin poisto";
    default:
      return "Larpit.fi: Confirm account removal";
  }
}

function getRemovalUrl(token: string) {
  return `${publicUrl}/profile/preferences/remove/${token}`;
}

export function confirmAccountRemovalText(
  locale: string,
  token: string
): string {
  locale = toSupportedLanguage(locale);

  switch (locale) {
    case "fi":
      return `Moi!

Joku, toivottavasti sinä, on pyytänyt Larpit.fi-käyttäjätilisi poistamista.

Vahvistaaksesi poiston avaa tämä sivu ja klikkaa "Poista käyttäjätilini"-nappia:

${getRemovalUrl(token)}

Huomaa, että vain Larpit.fi-tilisi poistetaan, ei Kompassi-tiliäsi. Jos haluat poistaa myös Kompassi-tilisi, ota yhteyttä Kompassin tukeen sähköpostitse.

Jos et tehnyt tätä pyyntöä, voit turvallisesti jättää tämän sähköpostin huomiotta. Käyttäjätiliäsi ei poisteta ilman tätä vahvistusta.

Ystävällisin terveisin
${signatureSeparator}
${formattedMailFrom}

Larpit.fi on Tracon ry:n (https://tracon.fi/ry) tarjoama palvelu.
Tutustu Larpit.fi:n tietosuojaselosteeseen: https://tracon.fi/tietosuoja/larpit-fi
`;

    default:
      return `Hi!

Someone, hopefully you, requested the removal of your Larpit.fi account.

To confirm the removal, please open the following page and click the "Remove my account" button:

${getRemovalUrl(token)}

Note that only your Larpit.fi account is removed, not your Kompassi account. If you also want to remove your Kompassi account, please contact Kompassi support by email.

If you did not make this request, you can safely ignore this email. Your account will not be removed without this confirmation.

Yours sincerely
${signatureSeparator}
${formattedMailFrom}

Larpit.fi is a service of Tracon ry (https://tracon.fi/ry).
See the privacy policy of Larpit.fi: https://tracon.fi/tietosuoja/larpit-fi
`;
  }
}

const style: React.CSSProperties = {
  fontFamily: "sans-serif",
  fontSize: "14pt",
  lineHeight: "1.5",
  padding: "20px",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 20px",
  backgroundColor: "#dc3545",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

export function ConfirmAccountRemoval({
  locale,
  token,
}: {
  locale: string;
  token: string;
}) {
  locale = toSupportedLanguage(locale);

  switch (locale) {
    case "fi":
      return (
        <Html style={style}>
          <Container>
            <Text>Moi!</Text>
            <Text>
              Joku, toivottavasti sinä, on pyytänyt Larpit.fi-käyttäjätilisi
              poistamista. Poisto edellyttää sähköpostivahvistusta.
            </Text>
            <Text>
              Vahvistaaksesi poiston avaa vahvistussivu alla olevasta napista ja
              klikkaa vahvistussivulla olevaa &quot;Poista
              käyttäjätilini&quot;-nappia:
            </Text>
            <Text>
              <Button href={getRemovalUrl(token)} style={buttonStyle}>
                Avaa vahvistussivu
              </Button>
            </Text>
            <Text>
              Huomaa, että vain Larpit.fi-tilisi poistetaan, ei Kompassi-tiliäsi.
              Jos haluat poistaa myös Kompassi-tilisi, ota yhteyttä Kompassin
              tukeen sähköpostitse.
            </Text>
            <Text>
              Jos et tehnyt tätä pyyntöä, voit turvallisesti jättää tämän
              sähköpostin huomiotta. Käyttäjätiliäsi ei poisteta ilman tätä
              vahvistusta.
            </Text>
            <Text>Ystävällisin terveisin</Text>
            <Hr />
            <Text>
              <em>{formattedMailFrom}</em>
            </Text>
            <Text>
              <small>
                Larpit.fi on{" "}
                <Link href="https://tracon.fi/ry">Tracon ry:n</Link> tarjoama
                palvelu. Tutustu{" "}
                <Link href={privacyPolicyUrl}>tietosuojaselosteeseen</Link>.
              </small>
            </Text>
          </Container>
        </Html>
      );
    default:
      return (
        <Html style={style}>
          <Container>
            <Text>Hi!</Text>
            <Text>
              Someone, hopefully you, requested the removal of your Larpit.fi
              account. The removal requires email verification.
            </Text>
            <Text>
              To confirm the removal, please open the verification page from the
              button below and click the &quot;Remove my account&quot; button:
            </Text>
            <Text>
              <Button href={getRemovalUrl(token)} style={buttonStyle}>
                Open verification page
              </Button>
            </Text>
            <Text>
              Note that only your Larpit.fi account is removed, not your Kompassi
              account. If you also want to remove your Kompassi account, please
              contact Kompassi support by email.
            </Text>
            <Text>
              If you did not make this request, you can safely ignore this email.
              Your account will not be removed without this confirmation.
            </Text>
            <Text>Yours sincerely</Text>
            <Hr />
            <Text>
              <em>{formattedMailFrom}</em>
            </Text>
            <Text>
              <small>
                Larpit.fi is a service of{" "}
                <Link href="https://tracon.fi/ry">Tracon ry</Link>. See the{" "}
                <Link href={privacyPolicyUrl}>Privacy policy</Link>.
              </small>
            </Text>
          </Container>
        </Html>
      );
  }
}

ConfirmAccountRemoval.PreviewProps = {
  locale: "fi",
  token: "5776302c-ea21-4205-8fe7-4665c832ef33",
};

export default ConfirmAccountRemoval;
