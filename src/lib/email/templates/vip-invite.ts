// VIP Invite Email Template

interface VipInviteEmailProps {
  inviteCode: string;
  grantsPremium: boolean;
  premiumDays?: number;
  appUrl: string;
}

export function getVipInviteEmail({
  inviteCode,
  grantsPremium,
  premiumDays = 365,
  appUrl,
}: VipInviteEmailProps): { subject: string; html: string; text: string } {
  const signupUrl = `${appUrl}/signup?invite=${inviteCode}`;
  const premiumYears = Math.floor(premiumDays / 365);
  const premiumText = premiumDays >= 36500
    ? "lifetime"
    : premiumYears >= 1
      ? `${premiumYears} year${premiumYears > 1 ? "s" : ""}`
      : `${premiumDays} days`;

  const subject = "You're invited to RacePace";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to RacePace</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f4f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="560" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #102a43; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                RacePace
              </h1>
              <p style="margin: 8px 0 0; color: #38bdf8; font-size: 14px;">
                Race Planning for Endurance Athletes
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #102a43; font-size: 24px; font-weight: 600;">
                You're Invited!
              </h2>

              <p style="margin: 0 0 24px; color: #486581; font-size: 16px; line-height: 1.6;">
                You've been personally invited to join RacePace - the race planning platform for endurance athletes.
              </p>

              ${grantsPremium ? `
              <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px; color: #0369a1; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Special Offer Included
                </p>
                <p style="margin: 0 0 16px; color: #102a43; font-size: 18px; font-weight: 600;">
                  ${premiumText} of Premium Access - FREE
                </p>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #486581; font-size: 14px; line-height: 1.8;">
                  <li>Unlimited race plans</li>
                  <li>Garmin sync for on-watch data</li>
                  <li>PDF exports & top tube stickers</li>
                  <li>Full gear management</li>
                  <li>Nutrition planning tools</li>
                </ul>
              </div>
              ` : ""}

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <a href="${signupUrl}" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                      Create Your Account
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px; color: #829ab1; font-size: 14px;">
                This invite expires in 30 days.
              </p>

              <p style="margin: 0; color: #829ab1; font-size: 12px;">
                If the button doesn't work, copy this link:<br>
                <a href="${signupUrl}" style="color: #0ea5e9; word-break: break-all;">${signupUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f0f4f8; padding: 24px 40px; text-align: center;">
              <p style="margin: 0; color: #829ab1; font-size: 12px;">
                RacePace - Plan your race, race your plan.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
You're Invited to RacePace!

You've been personally invited to join RacePace - the race planning platform for endurance athletes.

${grantsPremium ? `
SPECIAL OFFER: ${premiumText} of Premium Access - FREE

Includes:
- Unlimited race plans
- Garmin sync for on-watch data
- PDF exports & top tube stickers
- Full gear management
- Nutrition planning tools

` : ""}
Create your account here:
${signupUrl}

This invite expires in 30 days.

---
RacePace - Plan your race, race your plan.
  `.trim();

  return { subject, html, text };
}
