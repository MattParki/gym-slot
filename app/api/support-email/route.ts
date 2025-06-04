import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { name, email, message, supportEmail } = await request.json();

    // Validate inputs
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email and message are required' },
        { status: 400 }
      );
    }

    // Configure email transporter with Mailgun credentials
    const transporter = nodemailer.createTransport({
      host: process.env.MAILGUN_HOST,
      port: parseInt(process.env.MAILGUN_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.MAILGUN_USER,
        pass: process.env.MAILGUN_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.MAILGUN_USER,
      to: supportEmail || 'contact@prospectseasy.com',
      replyTo: email,
      subject: `Support Request from ${name}`,
      text: `
Name: ${name}
Email: ${email}

Message:
${message}
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #141E33;">New Support Request</h2>
  <p><strong>From:</strong> ${name} (${email})</p>
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
    <p style="white-space: pre-line;">${message}</p>
  </div>
  <p style="color: #666; font-size: 12px; margin-top: 30px;">This email was sent from the support widget on ProspectsEasy.</p>
</div>
      `,
      // Add Mailgun tracking headers
      headers: {
        'X-Mailgun-Track': 'yes',
        'X-Mailgun-Track-Clicks': 'yes',
        'X-Mailgun-Track-Opens': 'yes'
      }
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Support email error:', error);
    return NextResponse.json(
      { error: 'Failed to send support email' },
      { status: 500 }
    );
  }
}