
const escapeHtml = (value: string): string =>
    value.replace(/[&<>"']/g, (character) => {
        const entities: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        };
        return entities[character] || character;
    });

export const buildPasswordResetEmail = (email: string, code: string): { html: string; text: string } => {
    const safeEmail = escapeHtml(email);
    const safeCode = escapeHtml(code);
    const text = `Your Restpoint password reset code is ${code}.\n\nIt expires in 15 minutes. Do not share this code with anyone. If you did not request a password reset, ignore this email; your account remains safe.\n\nRestpoint · Nairobi, Kenya`;
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Restpoint security code</title>
  <style>
    body{margin:0;padding:0;background:#fff;color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
    @media only screen and (max-width:600px){
      .container{width:100%!important}
      .body-pad{padding:32px 22px 24px!important}
      .header-pad,.footer-pad{padding-left:22px!important;padding-right:22px!important}
      .otp-code{font-size:32px!important;letter-spacing:7px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#fff">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#fff">Your Restpoint password reset code is inside.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff">
    <tr><td align="center">
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#fff">
        <tr><td style="height:4px;background:#dd2d4a;font-size:0;line-height:0">&nbsp;</td></tr>
        <tr>
          <td class="header-pad" style="padding:26px 40px 22px;border-bottom:1px solid #efefef">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="font-size:22px;font-weight:800;letter-spacing:-.7px">Restpoint
                <div style="margin-top:4px;color:#777;font-size:10px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase">Secure Access</div>
              </td>
              <td align="right" style="color:#047857;font-size:11px">Encrypted &middot; Auto-sent</td>
            </tr></table>
          </td>
        </tr>
        <tr><td class="body-pad" style="padding:36px 40px 30px">
          <div style="margin-bottom:14px;color:#dd2d4a;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase">Security Verification</div>
          <h1 style="margin:0 0 14px;color:#0a0a0a;font-size:28px;line-height:1.2;letter-spacing:-.6px">Your password reset code</h1>
          <p style="margin:0 0 26px;color:#444;font-size:15px;line-height:1.6">We received a request to reset the password for <strong style="color:#0a0a0a">${safeEmail}</strong>. Enter this code in Restpoint to continue. It is valid for <strong style="color:#0a0a0a">15 minutes</strong>.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px">
            <tr><td style="padding:24px 16px;border:1px dashed #e0e0e0;border-radius:10px;text-align:center">
              <div style="margin-bottom:10px;color:#777;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Verification Code</div>
              <div class="otp-code" style="color:#00296b;font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:700;letter-spacing:11px;line-height:1.1">${safeCode}</div>
              <div style="margin-top:12px;color:#888;font-size:11px">Do not share this code with anyone</div>
            </td></tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:4px 0 4px 14px;border-left:3px solid #b45309">
              <p style="margin:0;color:#444;font-size:12.5px;line-height:1.6"><strong style="color:#b45309">Didn&rsquo;t request this email?</strong> Ignore it and your account will remain safe. Restpoint will never ask you to share your password or this code.</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td class="footer-pad" style="padding:26px 40px 22px;background:#0f3040;color:#aaa">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:11px;line-height:1.8"><strong style="color:#fff">Request details</strong><br>Sent to: <span style="color:#fff">${safeEmail}</span><br>Code expiry: <span style="color:#fff">15 minutes</span></td>
            <td align="right" style="font-size:11px;line-height:1.8"><strong style="color:#fff">Restpoint</strong><br>Nairobi, Kenya<br><a href="https://restpoint.co.ke" style="color:#dd2d4a">restpoint.co.ke</a></td>
          </tr></table>
          <p style="margin:18px 0 0;padding-top:14px;border-top:1px solid #34515d;color:#c2cbd0;font-size:10.5px;line-height:1.6;text-align:center">&copy; ${new Date().getFullYear()} Restpoint. This is an automated security email; please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
    return { html, text };
};