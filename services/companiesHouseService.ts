import { getSICCodeInfo, SICCode } from '@/data/sicCodes';

interface CompanySearchResult {
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

interface CompanyProfile {
  company_name: string;
  company_number: string;
  company_status: string;
  registered_office_address: {
    premises?: string;
    address_line_1?: string;
    address_line_2?: string;
    locality?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
  sic_codes?: string[];
  accounts?: {
    next_due?: string;
    last_accounts?: {
      made_up_to?: string;
    };
  };
  type?: string;
  date_of_creation?: string;
}

export class CompaniesHouseService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.company-information.service.gov.uk';

  constructor() {
    this.apiKey = process.env.COMPANIES_HOUSE_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('COMPANIES_HOUSE_API_KEY is required');
    }
  }

  private getAuthHeaders() {
    const auth = Buffer.from(`${this.apiKey}:`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    };
  }

  async searchCompanies(query: string, itemsPerPage: number = 20): Promise<CompanySearchResult[]> {
    try {
      const url = `${this.baseUrl}/search/companies?q=${encodeURIComponent(query)}&items_per_page=${itemsPerPage}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Companies House API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error searching companies:', error);
      throw error;
    }
  }

  async getCompanyProfile(companyNumber: string): Promise<CompanyProfile | null> {
    try {
      const url = `${this.baseUrl}/company/${companyNumber}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Companies House API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching company profile:', error);
      throw error;
    }
  }

  filterActiveCompanies(companies: CompanySearchResult[]): CompanySearchResult[] {
    return companies.filter(company => 
      company.company_status === 'active' ||
      company.company_status === 'Active'
    );
  }

  formatAddress(address: CompanySearchResult['address']): string {
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

  getBusinessTypeFromSIC(sicCodes: string[]): string {
    if (!sicCodes || sicCodes.length === 0) return 'Unknown';
    
    // Get the primary SIC code info
    const primarySIC = getSICCodeInfo(sicCodes[0]);
    return primarySIC?.sectionName || 'Other';
  }

  getDetailedBusinessDescription(sicCodes: string[]): string {
    if (!sicCodes || sicCodes.length === 0) return 'Business activities not specified';
    
    const descriptions = sicCodes.slice(0, 3).map(code => {
      const sicInfo = getSICCodeInfo(code);
      if (sicInfo) {
        return `${sicInfo.description} (${code})`;
      }
      return `Unknown activity (${code})`;
    }).filter(Boolean);
    
    if (descriptions.length === 0) return 'Business activities not specified';
    
    return descriptions.join('; ');
  }

  getPrimaryBusinessCategory(sicCodes: string[]): string {
    if (!sicCodes || sicCodes.length === 0) return 'Unspecified';
    
    const primarySIC = getSICCodeInfo(sicCodes[0]);
    return primarySIC?.description || 'Unspecified business activity';
  }

  getCompanySICInfo(sicCodes: string[]): SICCode[] {
    if (!sicCodes) return [];
    
    return sicCodes
      .map(code => getSICCodeInfo(code))
      .filter((sic): sic is SICCode => sic !== null);
  }
}