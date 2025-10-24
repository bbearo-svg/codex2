import { Resend } from "resend";
import fs from "fs";
import path from "path";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM ?? "catering@example.com";

export async function sendOrderConfirmationEmail(params: {
  to: string;
  subject: string;
  html: string;
  invoicePath?: string;
}) {
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY is not configured. Skipping email send.");
    return;
  }

  const resend = new Resend(resendApiKey);
  const attachments = params.invoicePath
    ? [
        {
          content: fs.readFileSync(params.invoicePath).toString("base64"),
          filename: path.basename(params.invoicePath),
        },
      ]
    : undefined;

  await resend.emails.send({
    from: emailFrom,
    to: params.to,
    subject: params.subject,
    html: params.html,
    attachments,
  });
}
