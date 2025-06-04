import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

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
      console.warn("No internal_email_id in event. Event:", eventData);
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
      console.warn(`Email not found in database for ${eventType} event`);
      return NextResponse.json({
        success: false,
        reason: "Email not found in database",
        event: eventType
      });
    }

    const emailDoc = querySnapshot.docs[0];
    const docRef = doc(db, "sentEmails", emailDoc.id);

    // Only handle the "unsubscribed" event
    if (eventType === "unsubscribed") {
      await updateDoc(docRef, {
        deliveryStatus: "unsubscribed",
        unsubscribedAt: new Date(timestamp * 1000),
        updatedAt: new Date()
      });

      return NextResponse.json({
        success: true,
        processed: true,
        event: "unsubscribed",
        documentId: emailDoc.id
      });
    }

    // Ignore all other events
    return NextResponse.json({
      success: true,
      processed: false,
      reason: "Event not handled",
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