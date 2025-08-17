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

export function verifyRequestSubject(locale: string) {
  locale = toSupportedLanguage(locale);

  switch (locale) {
    case "fi":
      return "Larpit.fi: Vahvista pyyntö";
    default:
      return "Larpit.fi: Verify your request";
  }
}

function getVerificationUrl(verificationCode: string) {
  return `${publicUrl}/verify/${verificationCode}`;
}

export function verifyRequestText(
  locale: string,
  verificationCode: string
): string {
  locale = toSupportedLanguage(locale);

  switch (locale) {
    case "fi":
      return `Moi!

Joku, toivottavasti sinä, on tehnyt larpin lisäys- tai muokkauspyynnön Larpit.fi:ssä tällä sähköpostiosoitteella.

Vahvistaaksesi pyynnön avaa tämä sivu ja klikkaa "Vahvista pyyntöni"-nappia:

${getVerificationUrl(verificationCode)}

Jos et tehnyt tätä pyyntöä, voit turvallisesti jättää tämän sähköpostin huomiotta.

Ystävällisin terveisin
${signatureSeparator}
${formattedMailFrom}

Larpit.fi on Tracon ry:n (https://tracon.fi/ry) tarjoama palvelu.
Tutustu Larpit.fi:n tietosuojaselosteeseen: https://tracon.fi/tietosuoja/larpit-fi
`;

    default:
      return `Hi!

Someone, hopefully you, requested to add or edit a larp at Larpit.fi using your email address.

To verify the request, please open the following page and click the "Verify my request" button:

${getVerificationUrl(verificationCode)}

If you did not make this request, you can safely ignore this email.

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
  backgroundColor: "#0070f3",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

export function VerifyRequest({
  locale,
  verificationCode,
}: {
  locale: string;
  verificationCode: string;
}) {
  locale = toSupportedLanguage(locale);

  switch (locale) {
    case "fi":
      return (
        <Html style={style}>
          <Container>
            <Text>Moi!</Text>
            <Text>
              Joku, toivottavasti sinä, on tehnyt larpin lisäys- tai
              muokkauspyynnön Larpit.fi:ssä tällä sähköpostiosoitteella. Koska
              pyyntö on tehty kirjautumatta sisään, edellyttää se
              sähköpostivahvistusta.
            </Text>
            <Text>
              Vahvistaaksesi pyynnön avaa vahvistussivu alla olevasta napista ja
              klikkaa vahvistussivulla olevaa &quot;Vahvista
              pyyntöni&quot;-nappia:
            </Text>
            <Text>
              <Button
                href={getVerificationUrl(verificationCode)}
                style={buttonStyle}
              >
                Avaa vahvistussivu
              </Button>
            </Text>
            <Text>
              Jos et tehnyt tätä pyyntöä, voit turvallisesti jättää tämän
              sähköpostin huomiotta.
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
              Someone, hopefully you, requested to add or edit a larp at
              Larpit.fi using your email address. Since the request was made
              without logging in, it requires email verification.
            </Text>
            <Text>
              To verify the request, please open the following page and click
              the &quot;Verify my request&quot; button:
            </Text>
            <Text>
              <Button
                href={getVerificationUrl(verificationCode)}
                style={buttonStyle}
              >
                Open verification page
              </Button>
            </Text>
            <Text>
              If you did not make this request, you can safely ignore this
              email.
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

VerifyRequest.PreviewProps = {
  locale: "fi",
  verificationCode: "5776302c-ea21-4205-8fe7-4665c832ef33",
};

export default VerifyRequest;
