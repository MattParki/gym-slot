// lib/leadgen-utils.ts - Updated with contact scraping support
export interface ContactPerson {
  name: string;
  title?: string;
  email?: string;
  confidence: number;
}

export interface Lead {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  website?: string;
  notes?: string;
  status?: string;
  contactPeople?: ContactPerson[];
  validation?: {
    companiesHouseFound: boolean;
    isActive?: boolean;
    officialName?: string;
    companyNumber?: string;
    companyStatus?: string;
    dateOfCreation?: string;
    addressUpdated?: boolean;
    suggestedName?: string;
    businessType?: string;
    warning?: string;
    error?: string;
    country?: string;
    isInternational?: boolean;
    info?: string;
    // Contact scraping fields
    websiteScraped?: boolean;
    contactsFound?: number;
    scrapingMethod?: 'playwright';
    scrapingError?: string;
  };
}

export interface ValidationSummary {
  total_leads: number;
  companies_house_validated: number;
  active_companies: number;
  websites_scraped: number;
  total_contacts_found: number;
  leads_with_contacts: number;
}

export interface ScrapingSummary {
  scraping_enabled: boolean;
  websites_scraped?: number;
  total_contacts_found?: number;
  leads_with_contacts?: number;
  scraping_errors?: number;
  scraping_method_used?: 'playwright';
  message?: string;
}

export function extractJsonFromResponse(text: string): string {
  // Remove any leading/trailing whitespace
  const cleanText = text.trim();
  
  if (!cleanText) {
    throw new Error("Empty response from AI");
  }

  console.log("Raw AI response:", cleanText.substring(0, 200) + "..."); // Log the start of the response
  
  // Method 1: Look for JSON in code blocks (```json...```)
  const codeBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    const extracted = codeBlockMatch[1].trim();
    try {
      JSON.parse(extracted); // Validate JSON
      return extracted;
    } catch (e) {
      console.error("Invalid JSON in code block:", e);
    }
  }

  // Method 2: Look for a JSON array anywhere in the text
  const arrayMatch = cleanText.match(/\[\s*{[\s\S]*?}\s*\]/);
  if (arrayMatch) {
    const extracted = arrayMatch[0];
    try {
      JSON.parse(extracted); // Validate JSON
      return extracted;
    } catch (e) {
      console.error("Invalid JSON in array match:", e);
    }
  }

  // Method 3: Check if the entire response is JSON (starts with [ and ends with ])
  if (cleanText.startsWith('[') && cleanText.endsWith(']')) {
    try {
      JSON.parse(cleanText); // Validate JSON
      return cleanText;
    } catch (e) {
      console.error("Invalid JSON in full response:", e);
    }
  }

  // Method 4: Try to find the start and end of JSON manually
  const startIndex = cleanText.indexOf('[');
  const endIndex = cleanText.lastIndexOf(']');
  
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const potentialJson = cleanText.substring(startIndex, endIndex + 1);
    
    try {
      JSON.parse(potentialJson);
      return potentialJson;
    } catch (e) {
      console.error("Invalid JSON in manual extraction:", e);
    }
  }

  console.error("Response format:", {
    length: cleanText.length,
    startsWithBracket: cleanText.startsWith('['),
    endsWithBracket: cleanText.endsWith(']'),
    firstChar: cleanText[0],
    lastChar: cleanText[cleanText.length - 1],
  });

  throw new Error("No valid JSON array found in AI response. Check server logs for details.");
}

export function isUKCompany(lead: Lead): boolean {
  const address = lead.address?.toLowerCase() || '';
  const website = lead.website?.toLowerCase() || '';
  const phone = lead.phone || '';
  
  // Check for UK indicators
  const ukIndicators = [
    // Address indicators
    address.includes('uk'), 
    address.includes('united kingdom'), 
    address.includes('england'), 
    address.includes('scotland'), 
    address.includes('wales'), 
    address.includes('northern ireland'),
    // Common UK postal code patterns
    /[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}/i.test(address),
    // UK phone numbers
    phone.startsWith('+44'), 
    phone.startsWith('44'), 
    phone.startsWith('0'),
    // UK domain
    website.includes('.co.uk'), 
    website.includes('.uk'),
    // UK cities (common ones)
    address.includes('london'), 
    address.includes('manchester'), 
    address.includes('birmingham'), 
    address.includes('glasgow'),
    address.includes('edinburgh'), 
    address.includes('cardiff'),
    address.includes('belfast'), 
    address.includes('liverpool'),
    address.includes('bristol'), 
    address.includes('leeds'),
    address.includes('sheffield'), 
    address.includes('nottingham'),
    address.includes('southampton'), 
    address.includes('newcastle')
  ];
  
  return ukIndicators.some(indicator => indicator);
}

export function detectCountryFromLead(lead: Lead): string {
  const address = lead.address?.toLowerCase() || '';
  const website = lead.website?.toLowerCase() || '';
  
  // Simple country detection based on common indicators
  if (address.includes('canada') || website.includes('.ca')) return 'Canada';
  if (address.includes('germany') || website.includes('.de')) return 'Germany';
  if (address.includes('france') || website.includes('.fr')) return 'France';
  if (address.includes('australia') || website.includes('.au')) return 'Australia';
  if (address.includes('usa') || address.includes('united states') || website.includes('.com')) return 'USA';
  if (address.includes('india') || website.includes('.in')) return 'India';
  if (address.includes('china') || website.includes('.cn')) return 'China';
  
  return 'International';
}

export function transformAIResponseToLeads(jsonResponse: any[]): Lead[] {
  return jsonResponse.map((lead: any) => ({
    id: `temp-${Math.random()}`,
    name: lead.name || "",
    company: lead.company || "",
    email: lead.email || "",
    phone: lead.phone || "",
    website: lead.website || "",
    address: lead.address || "",
    notes: lead.notes || "",
    contactPeople: [], // Initialize empty array for contact scraping
    validation: {
      companiesHouseFound: false,
      websiteScraped: false,
      contactsFound: 0
    }
  }));
}

export function processValidatedLeads(enrichedLeads: Lead[]): Lead[] {
  return enrichedLeads.map((lead: Lead, index: number) => {
    // Ensure we have a proper ID
    const processedLead: Lead = {
      ...lead,
      id: `lead-${index + 1}`,
      name: lead.name || "",
      company: lead.company || "",
      email: lead.email || "",
      phone: lead.phone || "",
      website: lead.website || "",
      address: lead.address || "",
      notes: lead.notes || "",
      status: "lead",
      contactPeople: lead.contactPeople || [],
      validation: lead.validation || undefined,
    };

    // Enhanced contact handling: if no primary name, use the best contact
    if (!processedLead.name && processedLead.contactPeople && processedLead.contactPeople.length > 0) {
      const bestContact = processedLead.contactPeople.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      
      processedLead.name = bestContact.name;
      
      // Also use their email if the lead doesn't have one
      if (!processedLead.email && bestContact.email) {
        processedLead.email = bestContact.email;
      }
      
      console.log(`Set primary contact for ${processedLead.company}: ${bestContact.name}`);
    }

    // Ensure contact notes are properly formatted (this should already be done in mergeContactsIntoLead)
    if (processedLead.contactPeople && processedLead.contactPeople.length > 0) {
      // Double-check that contact notes are present
      if (!processedLead.notes?.includes('People who we can name when outreaching')) {
        const contactNotes = generateContactNotes(processedLead.contactPeople);
        processedLead.notes = processedLead.notes 
          ? `${processedLead.notes}. ${contactNotes}`
          : contactNotes;
      }
    }

    return processedLead;
  });
}

export function generateValidationSummary(processedLeads: Lead[]): ValidationSummary {
  const validatedCount = processedLeads.filter(lead => lead.validation?.companiesHouseFound).length;
  const activeCount = processedLeads.filter(lead => lead.validation?.isActive).length;
  
  // Contact scraping statistics
  const websitesScraped = processedLeads.filter(lead => lead.validation?.websiteScraped === true).length;
  const totalContactsFound = processedLeads.reduce((sum, lead) => sum + (lead.validation?.contactsFound || 0), 0);
  const leadsWithContacts = processedLeads.filter(lead => (lead.contactPeople?.length || 0) > 0).length;

  return {
    total_leads: processedLeads.length,
    companies_house_validated: validatedCount,
    active_companies: activeCount,
    websites_scraped: websitesScraped,
    total_contacts_found: totalContactsFound,
    leads_with_contacts: leadsWithContacts,
  };
}

export function generateScrapingSummary(
  leads: Lead[], 
  scrapingEnabled: boolean
): ScrapingSummary {
  if (!scrapingEnabled) {
    return {
      scraping_enabled: false,
      message: "Contact scraping was disabled"
    };
  }

  const websitesScraped = leads.filter(lead => lead.validation?.websiteScraped === true).length;
  const totalContactsFound = leads.reduce((sum, lead) => sum + (lead.validation?.contactsFound || 0), 0);
  const leadsWithContacts = leads.filter(lead => (lead.contactPeople?.length || 0) > 0).length;
  const scrapingErrors = leads.filter(lead => lead.validation?.scrapingError).length;

  return {
    scraping_enabled: true,
    websites_scraped: websitesScraped,
    total_contacts_found: totalContactsFound,
    leads_with_contacts: leadsWithContacts,
    scraping_errors: scrapingErrors,
    scraping_method_used: 'playwright'
  };
}

/**
 * Merge contact information from website scraping into lead data
 */
export function mergeContactsIntoLead(lead: Lead, scrapedContacts: ContactPerson[]): Lead {
  if (!scrapedContacts || scrapedContacts.length === 0) {
    return {
      ...lead,
      validation: {
        ...lead.validation,
        companiesHouseFound: lead.validation?.companiesHouseFound ?? false,
        websiteScraped: true,
        contactsFound: 0
      }
    };
  }

  // Sort contacts by confidence (highest first)
  const sortedContacts = scrapedContacts.sort((a, b) => b.confidence - a.confidence);
  
  const updatedLead: Lead = {
    ...lead,
    contactPeople: sortedContacts,
    validation: {
      ...lead.validation,
      companiesHouseFound: lead.validation?.companiesHouseFound ?? false,
      websiteScraped: true,
      contactsFound: sortedContacts.length
    }
  };

  // Set the highest confidence contact as the primary name if lead doesn't have one
  if (!updatedLead.name && sortedContacts.length > 0) {
    const bestContact = sortedContacts[0];
    updatedLead.name = bestContact.name;
    
    // Also use their email if lead doesn't have one
    if (!updatedLead.email && bestContact.email) {
      updatedLead.email = bestContact.email;
    }
  }

  // Create enhanced notes with contact information
  const contactNotes = generateContactNotes(sortedContacts);
  
  // Add contact information to existing notes
  if (updatedLead.notes) {
    // Check if notes already contain contact information to avoid duplication
    if (!updatedLead.notes.toLowerCase().includes('people who we can name when outreaching')) {
      updatedLead.notes = `${updatedLead.notes}. ${contactNotes}`;
    }
  } else {
    updatedLead.notes = contactNotes;
  }

  return updatedLead;
}

function generateContactNotes(contacts: ContactPerson[]): string {
  if (contacts.length === 0) {
    return "Website scraped but no contacts found.";
  }

  // Filter for high confidence contacts (≥ 0.7) and those with meaningful information
  const goodContacts = contacts.filter(contact => 
    contact.confidence >= 0.7 && contact.name.trim().length > 0
  );

  if (goodContacts.length === 0) {
    return `Found ${contacts.length} contact(s) via website scraping (low confidence).`;
  }

  // Create the contact list for notes
  const contactList = goodContacts.slice(0, 5).map(contact => {
    let contactInfo = contact.name;
    
    // Add title if available and meaningful
    if (contact.title && contact.title.trim().length > 0) {
      contactInfo += ` (${contact.title})`;
    }
    
    // Add email if available
    if (contact.email && contact.email.trim().length > 0) {
      contactInfo += ` - ${contact.email}`;
    }
    
    return contactInfo;
  });

  // Format the note based on number of contacts
  if (contactList.length === 1) {
    return `People who we can name when outreaching: ${contactList[0]}`;
  } else if (contactList.length <= 3) {
    return `People who we can name when outreaching: ${contactList.join(', ')}`;
  } else {
    // For more than 3 contacts, list the first 3 and indicate there are more
    const firstThree = contactList.slice(0, 3).join(', ');
    const remaining = goodContacts.length - 3;
    return `People who we can name when outreaching: ${firstThree}${remaining > 0 ? ` and ${remaining} other${remaining > 1 ? 's' : ''}` : ''}`;
  }
}

/**
 * Helper function to check if a lead has high-quality contact information
 */
export function hasHighQualityContacts(lead: Lead): boolean {
  if (!lead.contactPeople || lead.contactPeople.length === 0) {
    return false;
  }

  // Check if any contact has high confidence (>= 0.8) and either an email or title
  return lead.contactPeople.some(contact => 
    contact.confidence >= 0.8 && (contact.email || contact.title)
  );
}

/**
 * Get the best contact from a lead's contact people
 */
export function getBestContact(lead: Lead): ContactPerson | null {
  if (!lead.contactPeople || lead.contactPeople.length === 0) {
    return null;
  }

  // Return the contact with the highest confidence
  return lead.contactPeople.reduce((best, current) => 
    current.confidence > best.confidence ? current : best
  );
}

/**
 * Filter leads by contact quality for prioritization
 */
export function filterLeadsByContactQuality(leads: Lead[]): {
  highQuality: Lead[];
  mediumQuality: Lead[];
  lowQuality: Lead[];
} {
  const highQuality: Lead[] = [];
  const mediumQuality: Lead[] = [];
  const lowQuality: Lead[] = [];

  leads.forEach(lead => {
    if (hasHighQualityContacts(lead)) {
      highQuality.push(lead);
    } else if (lead.contactPeople && lead.contactPeople.length > 0) {
      mediumQuality.push(lead);
    } else {
      lowQuality.push(lead);
    }
  });

  return { highQuality, mediumQuality, lowQuality };
}