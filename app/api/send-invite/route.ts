import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") return res.status(405).end();

    const { email, link } = req.body;

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.MAILGUN_HOST,
            port: parseInt(process.env.MAILGUN_PORT || "587"),
            secure: false,
            auth: {
                user: process.env.MAILGUN_USER,
                pass: process.env.MAILGUN_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Your App" <noreply@yourapp.com>`,
            to: email,
            subject: "You're invited to join a business on Our App",
            html: `
        <p>You’ve been invited to join a business on Our App.</p>
        <p><a href="${link}">Click here to accept the invitation and sign up</a>.</p>
      `,
        });

        res.status(200).json({ message: "Invitation sent" });
    } catch (error) {
        console.error("Failed to send email:", error);
        res.status(500).json({ message: "Failed to send email" });
    }
}
