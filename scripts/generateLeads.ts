import { OpenAI } from "openai";
import fs from "fs";
import path from "path";
import readline from "readline";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const systemMessage = `You are a lead generation assistant. Provide a JSON array of real business leads.

Only return businesses that include:
1. Business name
2. Email address

Example:
[
  {
    "company": "Business Name",
    "email": "someone@example.com"
  }
]

No markdown, no explanation, just the array.
`;

const prompt = "Find 10 small b2b businesses in the UK with valid email addresses.";

function extractJsonFromResponse(text: string): string {
  const match = text.match(/```json([\s\S]*?)```/i);
  if (match) return match[1].trim();

  const arrayMatch = text.match(/\[\s*{[\s\S]*?}\s*\]/);
  if (arrayMatch) return arrayMatch[0];

  throw new Error("No valid JSON found in AI response");
}

// Step 1: Load existing emails from leads.csv
async function loadExistingEmails(filePath: string): Promise<Set<string>> {
  const existingEmails = new Set<string>();

  if (!fs.existsSync(filePath)) return existingEmails;

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    const [name, email] = line.split(",");
    if (email && email !== "email") {
      existingEmails.add(email.trim().toLowerCase());
    }
  }

  return existingEmails;
}

// Step 2: Generate new leads that aren't duplicates
async function generateLeads(targetCount = 500) {
  const filePath = path.join(process.cwd(), "leads.csv");
  const existingEmails = await loadExistingEmails(filePath);
  const newLeads: { name: string; email: string }[] = [];

  let iteration = 0;

  while (newLeads.length < targetCount) {
    iteration++;
    console.log(`🌀 Iteration ${iteration}`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) continue;

    try {
      const cleaned = extractJsonFromResponse(responseText);
      const json = JSON.parse(cleaned);

      for (const lead of json) {
        const email = lead?.email?.trim().toLowerCase();
        const name = lead?.company?.trim();

        if (email && name && !existingEmails.has(email)) {
          existingEmails.add(email);
          newLeads.push({ name, email });

          if (newLeads.length >= targetCount) break;
        }
      }
    } catch (err) {
      console.warn("⚠️ Failed to parse response:", err);
    }
  }

  if (newLeads.length === 0) {
    console.log("🚫 No new unique leads found.");
    return;
  }

  const csvRows = newLeads.map((l) => `"${l.name}","${l.email}"`).join("\n");
  const csvHeader = !fs.existsSync(filePath) ? "name,email\n" : "";
  const csvData = csvHeader + csvRows + "\n";

  fs.appendFileSync(filePath, csvData, "utf8");

  console.log(`✅ Appended ${newLeads.length} unique leads to ${filePath}`);
}

generateLeads(); 

