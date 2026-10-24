export async function sendResetEmail(input: { to: string; url: string }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM ?? "OpenChurch <noreply@openchurch.dev>";
  if (!key) throw new Error("Password reset email is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: "Reset your OpenChurch password",
      text: `Reset your OpenChurch password:\n${input.url}\n\nThis link expires in one hour. If you did not ask for it, you can ignore this email.`,
    }),
  });
  if (!response.ok) throw new Error("Could not send the reset email");
}
