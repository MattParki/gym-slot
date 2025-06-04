import { getSICCodeInfo } from '@/data/sicCodes';
import { Lead, isUKCompany, detectCountryFromLead } from './leadgen-utils';

export interface CompanySearchResult {
  company_number: string;
  title: string;
  company_status: string;
  company_type: string;
  date_of_creation: string;
  address: {
    premises?: string;
    address_line_1?: string;
    address_line_2?: string;
    locality?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
  sic_codes?: string[];
  description?: string;
}

export class CompaniesHouseValidator {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.company-information.service.gov.uk';

  constructor() {
    this.apiKey = process.env.COMPANIES_HOUSE_API_KEY || '';
  }

  private getAuthHeaders(): HeadersInit {
    const auth = Buffer.from(`${this.apiKey}:`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    };
  }

  async searchCompany(companyName: string): Promise<CompanySearchResult | null> {
    if (!this.apiKey) return null;
    
    try {
      const url = `${this.baseUrl}/search/companies?q=${encodeURIComponent(companyName)}&items_per_page=5`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        console.warn(`Companies House API error for ${companyName}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data.items?.[0] || null; // Return the best match
    } catch (error) {
      console.warn(`Error validating company ${companyName}:`, error);
      return null;
    }
  }

  formatAddress(address: CompanySearchResult['address']): string {
    if (!address) return '';
    
    const parts = [
      address.premises,
      address.address_line_1,
      address.address_line_2,
      address.locality,
      address.region,
      address.postal_code
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  isActiveCompany(company: CompanySearchResult): boolean {
    return company?.company_status?.toLowerCase() === 'active';
  }
}

export async function validateAndEnrichLeads(
  leads: Lead[], 
  options?: { dateFilter?: number | null; cutoffYear?: number | null }
): Promise<Lead[]> {
  const companiesHouse = new CompaniesHouseValidator();
  const enrichedLeads: Lead[] = [];

  for (const lead of leads) {    
    // Always keep the lead, but try to enrich it
    const enrichedLead: Lead = { ...lead };
    
    // Only attempt Companies House validation for UK companies
    const isLikelyUKCompany = isUKCompany(lead);
    
    if (isLikelyUKCompany) {
      try {
        const companyData = await companiesHouse.searchCompany(lead.company || '');
        
        if (companyData) {
          if (options?.dateFilter && options?.cutoffYear) {
            const registrationYear = new Date(companyData.date_of_creation).getFullYear();
            if (registrationYear < options.cutoffYear) {
              enrichedLead.validation = {
                companiesHouseFound: true,
                isActive: companiesHouse.isActiveCompany(companyData),
                officialName: companyData.title,
                companyNumber: companyData.company_number,
                companyStatus: companyData.company_status,
                dateOfCreation: companyData.date_of_creation,
                country: 'UK',
                warning: `Company registered in ${registrationYear} - outside requested ${options.dateFilter} year timeframe`
              };
              enrichedLeads.push(enrichedLead);
              continue;
            }
          }
          
          // Enrich the lead with verified data
          enrichedLead.validation = {
            companiesHouseFound: true,
            isActive: companiesHouse.isActiveCompany(companyData),
            officialName: companyData.title,
            companyNumber: companyData.company_number,
            companyStatus: companyData.company_status,
            dateOfCreation: companyData.date_of_creation,
            country: 'UK'
          };

          // Check for company name mismatch and update if necessary
          if (companyData.title && companyData.title.toLowerCase() !== (lead.company || '').toLowerCase()) {
            // Significant name difference - update to official name
            const similarity = calculateNameSimilarity(lead.company || '', companyData.title);
            if (similarity < 0.7) { // Less than 70% similar
              enrichedLead.company = companyData.title; // Use official name
              enrichedLead.validation.suggestedName = companyData.title;
              enrichedLead.validation.warning = `Company name updated from "${lead.company}" to official registered name`;
            }
          }

          // Use verified address if available and current address is empty/generic
          const officialAddress = companiesHouse.formatAddress(companyData.address);
          if (officialAddress && (!lead.address || lead.address.length < 10)) {
            enrichedLead.address = officialAddress;
            enrichedLead.validation.addressUpdated = true;
          }

          // Add business type information if available
          if (companyData.sic_codes && companyData.sic_codes.length > 0) {
            const sicInfo = getSICCodeInfo(companyData.sic_codes[0]);
            enrichedLead.validation.businessType = sicInfo?.description || companyData.sic_codes[0];
            
            // Add useful business context to notes for proposal generation
            if (sicInfo && sicInfo.sectionName && sicInfo.description) {
              const businessContext = `Operates in ${sicInfo.sectionName.toLowerCase()} sector`;
              
              // Only add if it provides meaningful context for sales
              if (!enrichedLead.notes?.toLowerCase().includes(sicInfo.sectionName.toLowerCase())) {
                enrichedLead.notes = enrichedLead.notes 
                  ? `${enrichedLead.notes}. ${businessContext}`
                  : businessContext;
              }
            }
          }

          // Flag if company is not active
          if (!companiesHouse.isActiveCompany(companyData)) {
            enrichedLead.validation.warning = `Company status: ${companyData.company_status}`;
          }
        } else {
          enrichedLead.validation = {
            companiesHouseFound: false,
            warning: "UK company not found in Companies House register",
            country: 'UK'
          };
        }
      } catch (error) {
        console.warn(`Error validating UK company ${lead.company}:`, error);
        enrichedLead.validation = {
          companiesHouseFound: false,
          error: "Could not validate with Companies House",
          country: 'UK'
        };
      }
    } else {
      // Non-UK company - just mark as international
      enrichedLead.validation = {
        companiesHouseFound: false,
        isInternational: true,
        country: detectCountryFromLead(lead),
        info: "International company"
      };
    }

    enrichedLeads.push(enrichedLead);
    
    // Add delay between API calls for UK companies to respect rate limits
    if (isLikelyUKCompany) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return enrichedLeads;
}

function calculateNameSimilarity(name1: string, name2: string): number {
  const clean1 = name1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const clean2 = name2.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const longer = clean1.length > clean2.length ? clean1 : clean2;
  const shorter = clean1.length > clean2.length ? clean2 : clean1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}