import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, addDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const eventData = body['event-data'];

    if (!eventData) {
      console.warn("No event-data in Mailgun webhook payload");
      return NextResponse.json({ success: false, message: "No event-data in payload" });
    }

    // Extract event information
    const eventType = eventData.event;
    const recipientEmail = eventData.recipient;
    const timestamp = eventData.timestamp;

    // Get internal email ID from custom variables
    const variables = eventData['user-variables'] || {};
    const internalEmailId = variables['internal_email_id'];

    // Find the sent email in Firebase
    const sentEmailsRef = collection(db, "sentEmails");

    if (!internalEmailId) {
      return NextResponse.json({
        success: false,
        reason: "Missing internal_email_id",
        event: eventType
      });
    }

    let q = query(sentEmailsRef, where("internalEmailId", "==", internalEmailId));
    let querySnapshot = await getDocs(q);

    // If not found by internal ID, try by recipient email
    if (querySnapshot.empty && recipientEmail) {
      q = query(sentEmailsRef, where("to", "==", recipientEmail));
      querySnapshot = await getDocs(q);
    }

    if (querySnapshot.empty) {
      return NextResponse.json({
        success: false,
        reason: "Email not found in database",
        event: eventType
      });
    }

    const emailDoc = querySnapshot.docs[0];
    const emailData = emailDoc.data();
    const docRef = doc(db, "sentEmails", emailDoc.id);

    // Handle only the "opened" event
    if (eventType === "opened") {
      const userId = emailData.userId;
      const wasFirstOpen = !emailData.firstOpenedAt;
      const firstOpenedAt = emailData.firstOpenedAt || new Date(timestamp * 1000);

      await updateDoc(docRef, {
        openStatus: "opened",
        firstOpenedAt,
        openCount: wasFirstOpen ? 1 : emailData.openCount || 1,
        lastOpenedAt: new Date(timestamp * 1000),
        updatedAt: new Date()
      });

      // Only notify if this request set firstOpenedAt
      if (userId && wasFirstOpen) {
        await addDoc(collection(db, "notifications"), {
          userId,
          message: `Email "${emailData.subject}" has been opened by ${emailData.to}`,
          read: false,
          createdAt: new Date()
        });
      }

      return NextResponse.json({
        success: true,
        processed: true,
        event: "opened",
        documentId: emailDoc.id
      });
    }

    return NextResponse.json({
      success: true,
      processed: false,
      reason: "Unhandled event type",
      event: eventType
    });

  } catch (error) {
    console.error("Error handling Mailgun webhook:", error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}