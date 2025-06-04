import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import {
  extractJsonFromResponse,
  transformAIResponseToLeads,
  processValidatedLeads,
  generateValidationSummary,
  generateScrapingSummary,
  mergeContactsIntoLead,
  type Lead,
  type ContactPerson
} from "@/lib/leadgen-utils";
import { validateAndEnrichLeads } from "@/lib/companies-house-utils";
import { scrapeWebsiteForPeople } from "@/lib/website-scraper-utils";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
});

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { prompt, website, scrapeContacts = false } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // Extract date requirements from prompt
    const dateMatch = prompt.match(/(?:founded|established|created|registered|started).*?(?:in the )?last (\d+) years?/i);
    const dateFilter = dateMatch ? parseInt(dateMatch[1]) : null;
    
    const cutoffYear = dateFilter ? new Date().getFullYear() - dateFilter : null;

    // System message with strict formatting instructions
    let systemMessage = `You are a lead generation assistant focusing on real, verifiable businesses. You will create a list of potential business leads based on the user's prompt.

CRITICAL: Your response must be ONLY a valid JSON array. No explanations, no markdown, no additional text.

For each lead, extract:
1. Business name (use the exact company name as registered - this is crucial for verification)
2. Contact person's name (if available, otherwise empty string)
3. Email address (if available, otherwise empty string)
4. Phone number (in local format if available, otherwise empty string)
5. Website URL (if available, otherwise empty string - this is important for contact scraping)
6. Physical address (full address if available, otherwise empty string)
7. A brief description of their services/products
8. Sales-relevant insights: pain points, recent news, growth indicators, technology stack, market position, or reasons why they'd be a good lead

IMPORTANT REQUIREMENTS:
- Focus on real, established businesses in the specified location
- Use exact company names as they appear in official registrations (Companies House for UK companies)
- The company name should match the legal entity name, not just the brand/website name
- Include location context in addresses (city, country)
- Prefer companies with good online presence and established reputation
- ALWAYS include website URLs when available - these are essential for contact extraction
- Cross-reference company names with their websites to ensure accuracy
- Notes should contain actionable sales intelligence, not administrative details`;

    // Add date filtering instructions if detected
    if (dateFilter && cutoffYear) {
      systemMessage += `

DATE FILTERING REQUIREMENT:
- Only include companies registered/incorporated since ${cutoffYear}
- For UK companies, use Companies House registration dates as the primary source
- The user asked for companies from "the last ${dateFilter} years" - strictly adhere to this requirement
- Exclude any companies registered before ${cutoffYear}`;
    }

    // Add instructions about company name accuracy and website importance
    systemMessage += `

COMPANY NAME ACCURACY:
- The "company" field must be the official registered business name
- If a company trades under a different brand name than their registered name, use the registered name
- Ensure the company name corresponds to the website provided
- If there's a mismatch between brand name and legal name, prioritize the legal registered name

WEBSITE REQUIREMENTS:
- Always include website URLs when available (essential for contact scraping)
- Ensure URLs are complete and properly formatted (https://example.com)
- Verify that the website corresponds to the company name provided

Your response must be exactly this format:
[
  {
    "name": "Contact Person Name or empty string",
    "company": "Exact Legal/Registered Business Name",
    "email": "someone@example.com or empty string", 
    "phone": "+XX XXXXXXXXX or empty string",
    "website": "https://business.com or empty string",
    "address": "Full Address, City, Country or empty string",
    "notes": "Sales-relevant insight: why they'd be a good prospect, pain points, recent growth, etc."
  }
]

RESPOND WITH ONLY THE JSON ARRAY. DO NOT ADD ANY OTHER TEXT.`;

    if (website) {
      systemMessage += `\n\nAdditional context: The user has provided a website (${website}). Use this for additional context if possible, but ensure the company name matches the legal entity behind this website.`;
    }

    // Call OpenAI to generate leads
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    // Extract and transform the AI response
    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error("No response content from AI");
    }

    const rawLeads = extractJsonFromResponse(responseContent);
    const parsedLeads = JSON.parse(rawLeads) as any[];
    let leads = transformAIResponseToLeads(parsedLeads);

    // Validate and enrich leads with Companies House data
    leads = await validateAndEnrichLeads(leads, { dateFilter, cutoffYear });

    // Scrape websites for contact information if enabled
    if (scrapeContacts) {
      for (const lead of leads) {
        if (lead.website) {
          try {
            const scrapingResult = await scrapeWebsiteForPeople(lead.website);
            
            if (scrapingResult.scrapingSuccess) {
              // Update validation info
              if (!lead.validation) lead.validation = { companiesHouseFound: false };
              lead.validation.websiteScraped = true;
              lead.validation.contactsFound = scrapingResult.people.length;
              lead.validation.scrapingMethod = scrapingResult.method;
              
              // Add found contacts to the lead
              const contacts: ContactPerson[] = scrapingResult.people.map(person => ({
                name: person.name,
                title: person.title,
                email: person.email,
                confidence: person.confidence,
                source: person.source
              }));
              
              mergeContactsIntoLead(lead, contacts);
            } else if (scrapingResult.error) {
              if (!lead.validation) lead.validation = { companiesHouseFound: false };
              lead.validation.websiteScraped = false;
              lead.validation.scrapingError = scrapingResult.error;
            }
          } catch (error) {
            console.error(`Failed to scrape website for ${lead.website}:`, error);
            if (!lead.validation) lead.validation = { companiesHouseFound: false };
            lead.validation.websiteScraped = false;
            lead.validation.scrapingError = error instanceof Error ? error.message : 'Unknown error';
          }
        }
      }
    }

    // Process leads and generate summaries
    const processedLeads = processValidatedLeads(leads);
    const validationSummary = generateValidationSummary(processedLeads);
    const scrapingSummary = generateScrapingSummary(processedLeads, scrapeContacts);

    return NextResponse.json({
      leads: processedLeads,
      validation_summary: validationSummary,
      scraping_summary: scrapingSummary
    });

  } catch (error) {
    console.error('Lead generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate leads' },
      { status: 500 }
    );
  }
}