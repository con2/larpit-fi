import { createTransport } from "nodemailer";
import { mailOptions, nodeEnv, nodemailerConfig } from "./config";

const transport = createTransport(nodemailerConfig);

export async function sendEmail(
  to: string | string[],
  subject: string,
  text: string,
  html: string
): Promise<void> {
  if (!nodemailerConfig.host) {
    if (nodeEnv === "production") {
      throw new Error("Missing SMTP_HOSTNAME in NODE_ENV=production");
    }

    console.log("Would send send email were SMTP_HOSTNAME set:", {
      to,
      subject,
      text,
    });
    return;
  }

  await transport.sendMail({
    ...mailOptions,
    to,
    subject,
    html,
    text,
  });
}
