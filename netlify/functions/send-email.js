import nodemailer from 'nodemailer';

function generateConfirmationHtml(booking) {
  const refCode = booking?.id || 'N/A';
  const name = booking?.fullName || 'Student';
  const studentNum = booking?.studentNumber || 'N/A';
  const time = booking?.timeDisplay || 'N/A';
  const date = booking?.date || 'N/A';
  const course = booking?.course || 'N/A';
  const projectTitle = booking?.projectTitle || 'N/A';
  const email = booking?.email || '';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
      .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
      .header { background: #b91c1c; padding: 24px; text-align: center; color: #ffffff; }
      .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
      .header p { margin: 0; font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
      .body { padding: 24px; }
      .ref-box { background: #fef2f2; border: 1.5px dashed #f87171; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 20px; }
      .ref-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #991b1b; font-weight: 700; margin-bottom: 4px; }
      .ref-code { font-size: 24px; font-weight: 800; color: #b91c1c; font-family: monospace; letter-spacing: 0.08em; }
      .time-box { background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; text-align: center; }
      .time-slot { font-size: 18px; font-weight: 800; color: #065f46; font-family: monospace; }
      .time-date { font-size: 13px; color: #047857; font-weight: 600; margin-top: 2px; }
      .table-card { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
      .table-card td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; }
      .table-card td.label { font-weight: 600; color: #64748b; width: 35%; text-transform: uppercase; font-size: 11px; }
      .table-card td.val { font-weight: 700; color: #0f172a; }
      .note { font-size: 12px; color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; line-height: 1.5; margin-bottom: 16px; }
      .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <p>Mapúa University • OJT SchedPoint</p>
        <h1>Defense Schedule Confirmed</h1>
      </div>
      <div class="body">
        <p style="font-size: 14px; margin-top: 0; line-height: 1.5;">
          Hello <strong>${name}</strong>,<br>
          Your OJT defense presentation schedule has been officially registered and locked into the roster.
        </p>

        <div class="ref-box">
          <div class="ref-label">Official Reference Code</div>
          <div class="ref-code">${refCode}</div>
          <div style="font-size: 11px; color: #7f1d1d; margin-top: 6px;">
            ⚠️ Save this Reference Code! You will need it to retract or manage your reservation.
          </div>
        </div>

        <div class="time-box">
          <div class="time-slot">${time}</div>
          <div class="time-date">Scheduled Date: ${date}</div>
        </div>

        <table class="table-card">
          <tr>
            <td class="label">Student Name</td>
            <td class="val">${name}</td>
          </tr>
          <tr>
            <td class="label">Student Number</td>
            <td class="val" style="font-family: monospace;">${studentNum}</td>
          </tr>
          <tr>
            <td class="label">Course & Section</td>
            <td class="val">${course}</td>
          </tr>
          <tr>
            <td class="label">Project Title</td>
            <td class="val">${projectTitle}</td>
          </tr>
          <tr>
            <td class="label">Student Email</td>
            <td class="val">${email}</td>
          </tr>
          <tr>
            <td class="label">Status</td>
            <td class="val" style="color: #059669;">CONFIRMED & LOCKED IN</td>
          </tr>
        </table>

        <div class="note">
          <strong>Need to change or retract your schedule?</strong><br>
          Visit <a href="https://ojt-scheduler.netlify.app/" style="color: #b91c1c; text-decoration: underline;">OJT Schedpoint</a>, click <em>"Have a reservation? Manage or Retract"</em>, and enter your Reference Code: <strong>${refCode}</strong>.
        </div>
      </div>
      <div class="footer">
        Mapúa University • School of Information Technology • OJT SchedPoint
      </div>
    </div>
  </body>
  </html>
  `;
}

function generateRetractionHtml(booking) {
  const refCode = booking?.id || 'N/A';
  const name = booking?.fullName || 'Student';
  const studentNum = booking?.studentNumber || 'N/A';
  const time = booking?.timeDisplay || 'N/A';
  const date = booking?.date || 'N/A';
  const course = booking?.course || 'N/A';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
      .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
      .header { background: #475569; padding: 22px; text-align: center; color: #ffffff; }
      .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 800; }
      .header p { margin: 0; font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.05em; }
      .body { padding: 24px; }
      .notice-box { background: #f1f5f9; border-left: 4px solid #b91c1c; padding: 14px 16px; border-radius: 4px; margin-bottom: 20px; font-size: 13px; line-height: 1.5; }
      .table-card { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
      .table-card td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
      .table-card td.label { font-weight: 600; color: #64748b; width: 35%; text-transform: uppercase; font-size: 11px; }
      .table-card td.val { font-weight: 700; color: #0f172a; }
      .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <p>Mapúa University • OJT SchedPoint</p>
        <h1>Reservation Retracted</h1>
      </div>
      <div class="body">
        <div class="notice-box">
          <strong>Notice of Cancellation:</strong><br>
          Your defense appointment for <strong>${time}</strong> on <strong>${date}</strong> has been cancelled and the slot has been reopened for other students.
        </div>

        <table class="table-card">
          <tr>
            <td class="label">Student Name</td>
            <td class="val">${name}</td>
          </tr>
          <tr>
            <td class="label">Student Number</td>
            <td class="val" style="font-family: monospace;">${studentNum}</td>
          </tr>
          <tr>
            <td class="label">Course & Section</td>
            <td class="val">${course}</td>
          </tr>
          <tr>
            <td class="label">Released Slot</td>
            <td class="val" style="color: #b91c1c;">${time} • ${date}</td>
          </tr>
          <tr>
            <td class="label">Previous Ref Code</td>
            <td class="val" style="font-family: monospace;">${refCode}</td>
          </tr>
          <tr>
            <td class="label">Status</td>
            <td class="val" style="color: #64748b;">CANCELLED & RELEASED</td>
          </tr>
        </table>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">
          If you wish to choose another available time slot, you may visit <a href="https://ojt-scheduler.netlify.app/" style="color: #b91c1c; text-decoration: underline;">OJT Schedpoint</a> anytime.
        </p>
      </div>
      <div class="footer">
        Mapúa University • School of Information Technology • OJT SchedPoint
      </div>
    </div>
  </body>
  </html>
  `;
}

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'OK' }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { type, booking, recipientEmail, smtpConfig } = payload;

    const to = recipientEmail || booking?.email;
    if (!to) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Recipient email required' }) };
    }

    const user = process.env.SMTP_USER || smtpConfig?.user;
    const pass = process.env.SMTP_PASS || smtpConfig?.pass;
    const senderName = process.env.SMTP_SENDER_NAME || smtpConfig?.senderName || 'Mapúa OJT SchedPoint';

    if (!user || !pass) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ 
          error: 'SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in Netlify environment variables.' 
        }) 
      };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || smtpConfig?.host || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || smtpConfig?.port || 465),
      secure: true,
      auth: {
        user: user.trim(),
        pass: pass.trim().replace(/\s+/g, ''),
      },
    });

    const isRetraction = type === 'retraction';
    const subject = isRetraction
      ? `[OJT Schedpoint] Reservation Retracted: ${booking?.timeDisplay || ''} (${booking?.date || ''})`
      : `[OJT Schedpoint] Defense Confirmation Receipt — Ref: ${booking?.id || ''}`;

    const html = isRetraction ? generateRetractionHtml(booking) : generateConfirmationHtml(booking);

    const info = await transporter.sendMail({
      from: `"${senderName}" <${user.trim()}>`,
      to: to.trim(),
      subject,
      html,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, messageId: info.messageId, to })
    };
  } catch (error) {
    console.error('SMTP send error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Failed to send email' })
    };
  }
}
