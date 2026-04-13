import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM = 'Clonebase <contact@clonebase.app>';

/**
 * Send the welcome email after a user signs up.
 */
export async function sendWelcomeEmail(to: string, name?: string) {
  const displayName = name || to.split('@')[0];

  await getResend().emails.send({
    from: FROM,
    to,
    subject: 'Welcome to Clonebase',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;padding:40px 32px;">

      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
        Welcome to Clonebase, ${displayName}
      </h1>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
        You now have the power to build real software with plain English. No coding required.
      </p>

      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#111827;">Here's how to get started:</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#374151;vertical-align:top;width:24px;">1.</td>
            <td style="padding:6px 0;font-size:14px;color:#374151;">
              <strong>Describe your app</strong> — "Build me a restaurant website" or "Make an Instagram clone"
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#374151;vertical-align:top;">2.</td>
            <td style="padding:6px 0;font-size:14px;color:#374151;">
              <strong>Iterate</strong> — "Make the header dark" or "Add a search bar"
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#374151;vertical-align:top;">3.</td>
            <td style="padding:6px 0;font-size:14px;color:#374151;">
              <strong>Publish</strong> — Get a live URL instantly at yourapp.clonebase.app
            </td>
          </tr>
        </table>
      </div>

      <a href="https://clonebase.app/builder"
         style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
        Start Building
      </a>

      <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5;">
        You have <strong>30 free credits</strong> to get started. Each generation or edit uses 1 credit.
        Need more? Check out our <a href="https://clonebase.app/pricing" style="color:#4f46e5;text-decoration:none;">plans</a>.
      </p>
    </div>

    <p style="margin:24px 0 0;text-align:center;font-size:12px;color:#9ca3af;">
      Clonebase — Build software with words.<br />
      <a href="https://clonebase.app" style="color:#9ca3af;text-decoration:none;">clonebase.app</a>
    </p>
  </div>
</body>
</html>`,
  });
}

/**
 * Send a "credits running low" warning email.
 */
export async function sendCreditsLowEmail(to: string, remaining: number, limit: number) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `You have ${remaining} credits left on Clonebase`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;padding:32px;">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">
        You're running low on credits
      </h1>
      <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.5;">
        You have <strong>${remaining}</strong> of <strong>${limit}</strong> credits remaining this billing period.
      </p>
      <a href="https://clonebase.app/pricing"
         style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:8px;">
        Upgrade Plan
      </a>
    </div>
  </div>
</body>
</html>`,
  });
}
