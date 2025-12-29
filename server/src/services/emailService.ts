import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'mail.hiredbillingsupport.com',
  port: 465,
  secure: true, // true for port 465
  auth: {
    user: 'onboarding@hiredbillingsupport.com',
    pass: '12292025.OB-HBS!'
  }
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('✓ Email server is ready to send messages');
  }
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: '"E-Sign" <onboarding@hiredbillingsupport.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments
    });
    console.log(`✓ Email sent successfully to ${options.to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export function generateSigningEmail(
  recipientName: string,
  documentTitle: string,
  signingUrl: string,
  senderName: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #334155;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(to right, #4f46e5, #7c3aed, #9333ea);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 12px 12px 0 0;
        }
        .content {
          background: #ffffff;
          padding: 30px;
          border: 1px solid #e2e8f0;
          border-top: none;
        }
        .button {
          display: inline-block;
          background: linear-gradient(to right, #4f46e5, #7c3aed);
          color: white !important;
          padding: 14px 32px;
          text-decoration: none !important;
          border-radius: 8px;
          margin: 20px 0;
          font-weight: 600;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .button:hover {
          opacity: 0.9;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 14px;
        }
        .document-title {
          background: #f1f5f9;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">E-Sign</h1>
        <p style="margin: 10px 0 0 0;">Document Signature Request</p>
      </div>
      <div class="content">
        <p>Hi ${recipientName},</p>
        <p>${senderName} has requested your signature on a document:</p>
        <div class="document-title">
          📄 ${documentTitle}
        </div>
        <p>Please click the button below to review and sign the document:</p>
        <div style="text-align: center;">
          <a href="${signingUrl}" class="button">Review & Sign Document</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          Or copy and paste this link into your browser:<br>
          <a href="${signingUrl}" style="color: #4f46e5;">${signingUrl}</a>
        </p>
        <p style="color: #64748b; font-size: 13px;">
          This link will expire in 7 days. If you have any questions, please contact ${senderName} directly.
        </p>
      </div>
      <div class="footer">
        <p>This is an automated message from E-Sign.</p>
      </div>
    </body>
    </html>
  `;
}

export function generateCompletionEmail(
  recipientName: string,
  documentTitle: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #334155;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(to right, #16a34a, #059669);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 12px 12px 0 0;
        }
        .content {
          background: #ffffff;
          padding: 30px;
          border: 1px solid #e2e8f0;
          border-top: none;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 14px;
        }
        .success-badge {
          background: #dcfce7;
          color: #166534;
          padding: 15px;
          border-radius: 8px;
          font-weight: 600;
          margin: 15px 0;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">✓ Document Completed</h1>
      </div>
      <div class="content">
        <p>Hi ${recipientName},</p>
        <p>Great news! All parties have signed the document:</p>
        <div class="success-badge">
          ✓ ${documentTitle}
        </div>
        <p>The completed document is attached to this email. Please keep this copy for your records.</p>
        <p>Thank you for using E-Sign!</p>
      </div>
      <div class="footer">
        <p>This is an automated message from E-Sign.</p>
      </div>
    </body>
    </html>
  `;
}
