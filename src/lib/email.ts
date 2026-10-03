import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const emailFrom =
  process.env.EMAIL_FROM ?? "Bright Light Homes <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string) {
  const { error } = await resend.emails.send({
    from: emailFrom,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }
}
