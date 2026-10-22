const BRAND = "Crave";
const OTP_EXPIRY_MINUTES = 60;

export const MEMBER_INVITATION_OTP_EXPIRY_MINUTES = OTP_EXPIRY_MINUTES;

export function memberInvitationEmail(otp: string, role: string): { subject: string; html: string } {
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
    const subject = `You've been invited to ${BRAND} as ${roleLabel}`;

    const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <!--[if mso]>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
    <![endif]-->
    <style>
        html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
        * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    </style>
</head>
<body style="margin:0; padding:0; width:100%; background-color:#f4f5f7; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'; -webkit-font-smoothing: antialiased;">
    <div style="display:none; max-height:0; overflow:hidden; font-size:1px; line-height:1px; opacity:0;">
        Accept your invitation as ${roleLabel} — the code expires in 1 hour.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7;">
        <tr>
            <td align="center" style="padding:32px 16px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; width:100%;">
                    <tr>
                        <td style="padding:0 8px 16px 8px; text-align:left;">
                            <span style="font-size:24px; line-height:28px; font-weight:bold; color:#111827;">${BRAND}<span style="color:#e8562a;">.</span></span>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#ffffff; border:1px solid #e5e7eb; border-radius:12px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                                <tr>
                                    <td style="padding:40px 40px 8px 40px;">
                                        <h1 style="margin:0; font-size:22px; line-height:30px; font-weight:bold; color:#111827;">You've been invited</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 40px 24px 40px;">
                                        <p style="margin:0; font-size:15px; line-height:24px; color:#4b5563;">
                                            A restaurant team has invited you to join them on ${BRAND} as
                                            <strong style="color:#111827;">${roleLabel}</strong>.
                                            Accept your invitation with the code below.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:0 40px 24px 40px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                                            <tr>
                                                <td align="center" style="background-color:#fef1ee; border:1px solid #f5cfc4; border-radius:10px; padding:20px 24px;">
                                                    <span style="font-size:30px; line-height:36px; font-weight:bold; letter-spacing:8px; color:#e8562a; font-family:SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;">${otp}</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:0 40px 32px 40px;">
                                        <p style="margin:0; font-size:14px; line-height:22px; color:#6b7280;">
                                            This code expires in <strong style="color:#374151;">1 hour</strong> and can be used once.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:0 40px 40px 40px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-top:1px solid #e5e7eb;">
                                            <tr>
                                                <td style="padding-top:24px;">
                                                    <p style="margin:0; font-size:13px; line-height:20px; color:#6b7280;">
                                                        If you weren't expecting this invitation, you can safely ignore this email —
                                                        no account changes will happen on its own.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px 8px 8px 8px;">
                            <p style="margin:0; font-size:12px; line-height:18px; color:#9ca3af; text-align:center;">
                                ${BRAND} — hungry moments, handled.
                                <br>
                                © ${new Date().getFullYear()} ${BRAND}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    return { subject, html };
}
