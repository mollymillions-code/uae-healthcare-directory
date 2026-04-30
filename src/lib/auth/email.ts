type PasswordResetEmail = {
  to: string;
  name?: string | null;
  resetUrl: string;
};

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: PasswordResetEmail): Promise<void> {
  const safeName = name || "there";
  const html = `
    <p>Hi ${safeName},</p>
    <p>Use this link to reset your Zavis account password:</p>
    <p><a href="${resetUrl}">Reset password</a></p>
    <p>This link expires in 60 minutes. If you did not request this, you can ignore this email.</p>
  `;

  if (process.env.PLUNK_SECRET_KEY) {
    const { sendEmail } = await import("@/lib/research/plunk");
    await sendEmail({
      to,
      subject: "Reset your Zavis password",
      body: html,
      from: "directory@zavis.ai",
      name: "Zavis Directory",
    });
    return;
  }

  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Zavis Directory <directory@zavis.ai>",
      to,
      subject: "Reset your Zavis password",
      html,
    });
    return;
  }

  console.warn("[consumer-auth] email provider not configured. Reset URL:", resetUrl);
}
