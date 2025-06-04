import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import admin from "firebase-admin";
import { adminDb } from "@/lib/firebase-admin";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Business accounts to use custom ProspectsEasy prompt
const BUSINESS_ACCOUNTS = ["matt@prospectseasy.com", "mikel@prospectseasy.com"];

// ProspectsEasy social links for business accounts
const PROSPECTS_EASY_SOCIALS = [
  { name: "TikTok", href: "https://tiktok.com/@prospectseasy" },
  { name: "YouTube", href: "https://youtube.com/@prospectseasy" },
  { name: "X (Twitter)", href: "https://x.com/prospectseasy" },
  { name: "Instagram", href: "https://instagram.com/prospectseasy" },
];

export async function POST(request: NextRequest) {
  try {
    const {
      proposalDescription = "pitch to this client",
      tone = "professional",
      template = "sales",
      yourName,
      yourEmail,
      yourPhone,
      clientName,
      clientAddress,
      clientWebsite,
      clientEmail,
      clientStatus = "lead",
      date = new Date().toLocaleDateString(),
      length = "short",
      language = "english",
      audience = "general",
      format = "paragraph",
      style = "confident",
      pitchType = "email",
      userId,
      clientId,
      saveToFirebase = false, // Flag to determine if we should save
      userSpecializations = "various products and services",
      userIndustry = "general business",
    } = await request.json();

    // More graceful handling of missing fields
    const safeYourName = yourName || "Your Name";
    let safeClientName = (!clientName || clientName === "N/A") ? "Valued Client" : clientName;
    const safeClientWebsite = clientWebsite || "";

    // Check if this is a business account (ProspectsEasy team member)
    const isBusinessAccount = BUSINESS_ACCOUNTS.includes(yourEmail);

    // Default values
    let industry = userIndustry;
    let specializations = userSpecializations;

    // Override for business accounts
    if (isBusinessAccount) {
      industry = "sales automation";
      specializations =
        "CRM automation, cold email outreach, sales outreach, lead generation, and prospect management software";
    }

    let clientCompany = "";
    let clientNotes = "";

    // Fetch client details only if clientId is provided
    if (clientId) {
      try {
        const clientRef = adminDb.collection("clients").doc(clientId);
        const clientDoc = await clientRef.get();

        if (clientDoc.exists) {
          const data = clientDoc.data();
          if (data && data.userId === userId) {
            clientCompany = data.company || "";
            clientNotes = data.notes || "";
            if (!clientName && data.name) {
              safeClientName = data.name;
            }
          } else {
            console.error("Permission denied: Client does not belong to the current user", {
              clientId,
              userId,
            });
          }
        }
      } catch (error) {
        console.error(
          "Error fetching client details:",
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Build additional context from client details
    let contextForAI = "";

    if (clientStatus === "lead") {
      contextForAI += `IMPORTANT: This client is a new lead. Use a more ${tone}, introductory tone while not overdoing it. `;
    } else if (clientStatus === "prospect") {
      contextForAI += `IMPORTANT: This client is a prospect who has shown interest but hasn't made a purchase yet. Use a ${tone} warm, encouraging tone. `;
    } else if (clientStatus === "client") {
      contextForAI += `IMPORTANT: This client is an existing client. Use a familiar, friendly tone acknowledging the ongoing relationship. `;
    }

    // Different context based on business vs. regular account
    if (isBusinessAccount) {
      // Alex Hormozi’s approach: emphasize free offers, big promise, add urgency
      contextForAI += `IMPORTANT: You are writing as ${safeYourName} from ProspectsEasy. Emphasize time savings, low risk, and a free trial, but in a friendly, helpful way. Show empathy for their sales challenges. `;
    } else {
      contextForAI += `IMPORTANT: You are writing as ${safeYourName}, a salesperson in ${industry}, specializing in ${specializations}. Show empathy, avoid overdoing it, and incorporate relevant industry terms. `;
    }

    // If we have client notes
    if (clientNotes) {
      contextForAI += `IMPORTANT: Use the client notes to personalize but don't mention them directly: ${clientNotes}. `;
    }

    if (safeClientWebsite) {
      contextForAI += `IMPORTANT: The client has a website at ${safeClientWebsite}. Subtly incorporate insights from their site without openly stating you reviewed it, unless context demands it. `;
    }

    // Decide how to tailor pitch based on account type
    if (isBusinessAccount) {
      contextForAI += `IMPORTANT: Based on the client notes (${clientNotes}), highlight relevant ProspectsEasy features. Use a bold, high-value style reminiscent of Hormozi’s approach: present a strong guarantee, emphasize how you remove risk, and include how you’ll over-deliver. `;
    } else {
      contextForAI += `IMPORTANT: Focus on products/services relevant to ${safeClientName}, referencing ${specializations}. Do not mention the notes directly, but subtly tailor the offer. `;
    }

    let prompt = `
      ${contextForAI}

      Write a ${tone}, ${style}-style ${pitchType === "call" ? "phone call script" : "email pitch"} to ${safeClientName}${clientCompany ? ` from ${clientCompany}` : ""
      } who is a ${clientStatus}.

      Make it ${length} in length, in ${language}, formatted as ${format}.

      Your ${pitchType} should:
      - Sound natural and conversational in a ${tone} tone
    `;

    // Customize bullet points based on account type
    if (isBusinessAccount) {
      prompt += `
      - Specifically address their sales and prospect management needs
      - Show them an irresistible, risk-free offer: highlight it’s “FREE to try” with no credit card needed
      - Use “shock and awe” benefits from Alex Hormozi’s formula (big promise, strong guarantee, urgency, clear CTA)
      - Mention how ProspectsEasy is superior to manual processes or other CRM platforms
      - If you're mentioning where to find the offer, use the website https://demo.prospectseasy.com as a reference, make sure not to duplicate this reference
      `;
    } else {
      prompt += `
      - Specifically address their needs related to ${specializations}
      - Highlight how your products/services are superior with reliable service
      - Reference your relevant expertise in ${industry}
      `;
    }

    if (safeClientWebsite) {
      prompt += `
      - Subtly incorporate insights from their website (${safeClientWebsite}) to show you’ve done your homework
      `;
    }

    prompt += `
      CRUCIAL INSTRUCTION: Never use placeholder text like "[Client's Name]" or "[YOUR NAME]". Always use the actual name "${safeClientName}".
      IMPORTANT:
      - Address the client as "${safeClientName}" — no placeholders like "[Prospect's Name]"
      - Sign the message as "${safeYourName}" — no placeholders like "[Your Full Name]"
      - Include contact info exactly as: ${yourEmail ? `email: ${yourEmail}` : ""}${yourPhone ? ` phone: ${yourPhone}` : ""
      }
      - No square brackets []
      - no double hyphens --
      - don't include any text in brackets like [ProspectsEasy Free Trial]
      - Make it professional, concise, yet high-impact

      IMPORTANT: Incorporate ${proposalDescription} and ${clientNotes} naturally.

      ${safeClientWebsite
        ? `IMPORTANT: Weave in insights from ${safeClientWebsite} discreetly, so they know you understand their business.`
        : ""
      }
    `;

    // Different closing based on account type
    if (isBusinessAccount) {
      prompt += `
      IMPORTANT: End with a strong pitch to try ProspectsEasy for free, no obligations or bank details. 
      Use a powerful CTA referencing Hormozi’s emphasis on risk-reversal and guaranteed value. 
      Sign off as "${safeYourName}". Then add a short PS with our social media links (TikTok, YouTube, Twitter, Instagram) under the handle @prospectseasy.
      Don’t include your email ("${yourEmail}") in the signature to avoid placeholders.
      `;
    } else {
      prompt += `
      IMPORTANT: Keep industry terminology appropriate, mention your expertise, and end with a natural CTA.
      `;
    }

    prompt = prompt.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: isBusinessAccount
            ? "You are a pro sales agent for ProspectsEasy. No placeholder text like [Client's Name]."
            : "You are a professional sales agent. No placeholder text like [Client's Name].",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 800,
    });

    let proposal = completion.choices[0]?.message?.content?.trim();
    let subject = `Proposal for ${safeClientName}`;

    // Additional safety check
    if (proposal) {
      const lines = proposal.trim().split("\n");
      const firstLine = lines[0].trim();

      if (firstLine.toLowerCase().startsWith("subject:")) {
        subject = firstLine.substring("subject:".length).trim();
        let bodyStartIndex = 1;
        while (bodyStartIndex < lines.length && lines[bodyStartIndex].trim() === "") {
          bodyStartIndex++;
        }
        proposal = lines.slice(bodyStartIndex).join("\n");
      }

      proposal = proposal.replace(/\[Client'?s? Name\]/gi, safeClientName);
      proposal = proposal.replace(/\[Your Full Name\]/gi, safeYourName);
      proposal = proposal.replace(/\[Your Name\]/gi, safeYourName);
      proposal = proposal.replace(/\[Prospect'?s? Name\]/gi, safeClientName);
    }

    // For business accounts, ensure social links are included if partly missing
    if (isBusinessAccount && proposal && !proposal.includes("TikTok") && !proposal.includes("YouTube")) {
      const socialLinkText = `
\n\nPS: You can learn more about ProspectsEasy here:
TikTok: @prospectseasy
YouTube: @prospectseasy
X (Twitter): @prospectseasy
Instagram: @prospectseasy`;
      proposal += socialLinkText;
    }

    let proposalId = null;

    // Save to Firebase if we have a userId and saveToFirebase is true
    if (userId && saveToFirebase) {
      let updatedClientStatus = clientStatus || "lead";
      if (clientId) {
        try {
          const clientRef = adminDb.collection("clients").doc(clientId);
          const clientDoc = await clientRef.get();
          if (clientDoc.exists) {
            const clientData = clientDoc.data();
            if (clientData && clientData.status) {
              updatedClientStatus = clientData.status;
            }
          }
        } catch (error) {
          console.error("Error getting client status:", error);
        }
      }
      const docRef = await adminDb.collection("proposals").add({
        userId,
        clientId: clientId || null,
        yourName: safeYourName,
        yourEmail,
        yourPhone,
        clientName: safeClientName,
        clientEmail: clientEmail || "",
        clientWebsite: clientWebsite || "",
        clientAddress: clientAddress || "",
        clientCompany: clientCompany || "",
        clientStatus: updatedClientStatus,
        date: date || "",
        proposalDescription,
        proposal: proposal || "",
        subject: subject || "",
        tone,
        template,
        length,
        language,
        audience,
        format,
        style,
        pitchType,
        isBusinessAccount,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      proposalId = docRef.id;
    }

    return NextResponse.json({ proposal, subject, proposalId });
  } catch (error) {
    console.error(
      "Error generating proposal:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json({ error: "Failed to generate proposal" }, { status: 500 });
  }
}