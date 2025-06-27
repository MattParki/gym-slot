import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/lib/firebase";
import { adminDb } from "@/lib/firebase-admin";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    let { from, to, subject, text, html, userId, proposalId } = await req.json();

    const internalEmailId = randomUUID(); // Generate a unique ID for the email

    const senderEmail = from || "no-reply@breakfreedigitalagency.com";

    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: parseInt(process.env.MAILTRAP_PORT || "587"),
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });


    const htmlContent = html || `
  <div>${text.replace(/\n/g, '<br>')}</div>
`;

    console.log(htmlContent);

    const mailOptions = {
      from: senderEmail,
      to,
      subject,
      text,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Mailgun sendMail info:", info);

    // Store email data in Firestore
    const sentEmailsRef = collection(db, "sentEmails");
    const docRef = await addDoc(sentEmailsRef, {
      mailId: info.messageId,
      userId: userId || "anonymous",
      to,
      from: senderEmail,
      subject,
      sentAt: serverTimestamp(),
      initialStatus: "sent",
      deliveryStatus: "pending",
      openStatus: "not_opened",
      openCount: 0,
      openEvents: [],
      mailgunId: null,
      internalEmailId,
      ...(proposalId ? { proposalId } : {}),
    });

    if (to && userId) {
      try {
        const clientsSnapshot = await adminDb
          .collection("clients")
          .where("email", "==", to)
          .where("userId", "==", userId)
          .get();

        if (!clientsSnapshot.empty) {
          const clientDoc = clientsSnapshot.docs[0];
          const clientId = clientDoc.id;

          const today = new Date().toISOString().split('T')[0];
          await adminDb
            .collection("clients")
            .doc(clientId)
            .update({
              lastContactDate: today
            });
        }
      } catch (error) {
        console.error("Error updating client by email:", error);
      }
    }

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      internalEmailId
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}