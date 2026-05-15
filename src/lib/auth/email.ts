type PasswordResetEmail = {
  to: string;
  name?: string | null;
  resetUrl: string;
};

async function dispatchEmail(args: {
  to: string;
  subject: string;
  html: string;
  fallbackLogPrefix: string;
  fallbackUrl?: string;
}): Promise<void> {
  if (process.env.PLUNK_SECRET_KEY) {
    const { sendEmail } = await import("@/lib/research/plunk");
    await sendEmail({
      to: args.to,
      subject: args.subject,
      body: args.html,
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
      to: args.to,
      subject: args.subject,
      html: args.html,
    });
    return;
  }

  console.warn(
    `${args.fallbackLogPrefix} email provider not configured.`,
    args.fallbackUrl ? `Activation URL: ${args.fallbackUrl}` : ""
  );
}

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

  await dispatchEmail({
    to,
    subject: "Reset your Zavis password",
    html,
    fallbackLogPrefix: "[consumer-auth]",
    fallbackUrl: resetUrl,
  });
}

type ProviderPortalInviteEmail = {
  to: string;
  contactName?: string | null;
  providerName: string;
  activationUrl: string;
  expiresAt: Date;
};

export async function sendProviderPortalInviteEmail({
  to,
  contactName,
  providerName,
  activationUrl,
  expiresAt,
}: ProviderPortalInviteEmail): Promise<void> {
  const safeName = contactName || "there";
  const expiry = expiresAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const html = `
    <p>Hi ${safeName},</p>
    <p>Your claim for <strong>${providerName}</strong> on the UAE Open Healthcare Directory has been approved.</p>
    <p>Use the link below to activate your provider portal account and start managing the listing — adding photos, services, hours, and accepted insurance.</p>
    <p><a href="${activationUrl}">Activate provider portal</a></p>
    <p>This link expires on ${expiry}. If you did not request access to ${providerName}, please ignore this email.</p>
    <p>— Zavis Directory</p>
  `;

  await dispatchEmail({
    to,
    subject: `Activate your provider portal for ${providerName}`,
    html,
    fallbackLogPrefix: "[provider-portal-invite]",
    fallbackUrl: activationUrl,
  });
}

type ProviderPortalMagicLinkEmail = {
  to: string;
  magicLinkUrl: string;
  expiresAt: Date;
  providerName?: string | null;
};

export async function sendProviderPortalMagicLinkEmail({
  to,
  magicLinkUrl,
  expiresAt,
  providerName,
}: ProviderPortalMagicLinkEmail): Promise<void> {
  const expiry = expiresAt.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const providerLine = providerName
    ? `<p>This signs you into the portal for <strong>${providerName}</strong>.</p>`
    : "";
  const html = `
    <p>Hi there,</p>
    <p>Use this secure link to sign in to the Zavis provider portal:</p>
    ${providerLine}
    <p><a href="${magicLinkUrl}">Sign in to provider portal</a></p>
    <p>This link expires at ${expiry}. If you did not request this, you can ignore this email.</p>
    <p>— Zavis Directory</p>
  `;

  await dispatchEmail({
    to,
    subject: "Sign in to your Zavis provider portal",
    html,
    fallbackLogPrefix: "[provider-portal-magic-link]",
    fallbackUrl: magicLinkUrl,
  });
}
