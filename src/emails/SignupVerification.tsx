import { formattedMailFrom, privacyPolicyUrl, publicUrl } from "@/config";
import { toSupportedLanguage } from "@/translations";
import { Button, Container, Hr, Html, Link, Text } from "react-email";
import * as React from "react";

const signatureSeparator = "-- ";

export function signupVerificationSubject(locale: string) {
  locale = toSupportedLanguage(locale);

  switch (locale) {
    case "fi":
      return "Larpit.fi: Vahvista ilmoittautumisesi";
    default:
      return "Larpit.fi: Confirm your sign-up";
  }
}

function getVerificationUrl(larpId: string, verificationCode: string) {
  return `${publicUrl}/larp/${larpId}/signup/verify/${verificationCode}`;
}

export function signupVerificationText(
  locale: string,
  larpName: string,
  larpId: string,
  verificationCode: string,
): string {
  locale = toSupportedLanguage(locale);

  switch (locale) {
    case "fi":
      return `Moi!

Joku, toivottavasti sinä, on ilmoittautunut tapahtumaan "${larpName}" Larpit.fi:ssä tällä sähköpostiosoitteella.

Vahvistaaksesi ilmoittautumisesi avaa tämä sivu ja klikkaa vahvistusnappia:

${getVerificationUrl(larpId, verificationCode)}

Jos et tehnyt tätä ilmoittautumista, voit turvallisesti jättää tämän sähköpostin huomiotta.

Ystävällisin terveisin
${signatureSeparator}
${formattedMailFrom}

Larpit.fi on Tracon ry:n (https://tracon.fi/ry) tarjoama palvelu.
Tutustu Larpit.fi:n tietosuojaselosteeseen: https://tracon.fi/tietosuoja/larpit-fi
`;

    default:
      return `Hi!

Someone, hopefully you, signed up for "${larpName}" at Larpit.fi using your email address.

To confirm your sign-up, please open the following page and click the confirmation button:

${getVerificationUrl(larpId, verificationCode)}

If you did not sign up, you can safely ignore this email.

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

export function SignupVerification({
  locale,
  larpName,
  larpId,
  verificationCode,
}: {
  locale: string;
  larpName: string;
  larpId: string;
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
              Joku, toivottavasti sinä, on ilmoittautunut tapahtumaan &quot;
              {larpName}&quot; Larpit.fi:ssä tällä sähköpostiosoitteella.
            </Text>
            <Text>
              Vahvista ilmoittautumisesi klikkaamalla alla olevaa nappia:
            </Text>
            <Text>
              <Button
                href={getVerificationUrl(larpId, verificationCode)}
                style={buttonStyle}
              >
                Vahvista ilmoittautuminen
              </Button>
            </Text>
            <Text>
              Jos et ilmoittautunut, voit turvallisesti jättää tämän sähköpostin
              huomiotta.
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
              Someone, hopefully you, signed up for &quot;{larpName}&quot; at
              Larpit.fi using your email address.
            </Text>
            <Text>
              Please confirm your sign-up by clicking the button below:
            </Text>
            <Text>
              <Button
                href={getVerificationUrl(larpId, verificationCode)}
                style={buttonStyle}
              >
                Confirm sign-up
              </Button>
            </Text>
            <Text>
              If you did not sign up, you can safely ignore this email.
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

SignupVerification.PreviewProps = {
  locale: "fi",
  larpName: "Example Larp",
  larpId: "00000000-0000-0000-0000-000000000000",
  verificationCode: "5776302c-ea21-4205-8fe7-4665c832ef33",
};

export default SignupVerification;
