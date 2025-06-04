export interface PersonFound {
  name: string;
  title?: string;
  email?: string;
  source: 'website' | 'companies_house' | 'both';
  confidence: number; // 0-1 score
  context?: string; // Where/how they were found
}

export interface WebsiteScrapingResult {
  people: PersonFound[];
  scrapingSuccess: boolean;
  method: 'playwright';
  error?: string;
}

/**
 * Main scraping function using Playwright
 */
export async function scrapeWebsiteForPeople(
  websiteUrl: string
): Promise<WebsiteScrapingResult> {
  if (!websiteUrl) {
    return { people: [], scrapingSuccess: false, method: 'playwright', error: 'No URL provided' };
  }

  let browser;
  
  try {
    // Check if Playwright browsers are installed
    const { chromium } = await import('playwright');
    
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // For deployment
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    const cleanUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
    const foundPeople: PersonFound[] = [];
    const pagesToCheck = [
      '',
      '/about',
      '/team',
      '/about-us',
      '/leadership',
      '/contact',
      '/meet-the-team',
      '/founders',
      '/staff',
    ];
    
    for (const pagePath of pagesToCheck) {
      try {
        const pageUrl = `${cleanUrl}${pagePath}`;
        
        await page.goto(pageUrl, { 
          waitUntil: 'networkidle',
          timeout: 15000 // 15 second timeout
        });
        
        // Wait for potential dynamic content
        await page.waitForTimeout(3000);

        // Extract structured data (JSON-LD)
        const structuredData = await page.evaluate(() => {
          const scripts = document.querySelectorAll('script[type="application/ld+json"]');
          return Array.from(scripts).map(script => {
            try {
              return JSON.parse(script.textContent || '');
            } catch {
              return null;
            }
          }).filter(Boolean);
        });

        // Process structured data
        for (const data of structuredData) {
          const people = extractPeopleFromJsonLD(data);
          foundPeople.push(...people.map(p => ({
            ...p,
            confidence: 0.95,
            context: `Found in structured data on ${pagePath || 'homepage'}`
          })));
        }

        // Extract people from common patterns
        const extractedPeople = await page.evaluate((pagePath) => {
          const people: PersonFound[] = [];
          
          // Helper function to extract text content
          const getTextContent = (element: Element): string => {
            const clone = element.cloneNode(true) as Element;
            Array.from(clone.querySelectorAll('script, style')).forEach(el => el.remove());
            return clone.textContent?.trim() || '';
          };

          // Helper function to find email
          const findEmail = (element: Element): string | null => {
            const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
            const text = getTextContent(element);
            const match = text.match(emailRegex);
            return match ? match[0] : null;
          };

          // Process team member sections
          const teamSelectors = [
            '[class*="team-member"]',
            '[class*="staff-member"]',
            '[class*="person-card"]',
            '[class*="bio"]',
            '[class*="profile"]',
            '[class*="founder"]',
            '[class*="leadership"]',
            '[class*="executive"]',
            '[class*="director"]'
          ];

          teamSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
              const nameElement = element.querySelector('[class*="name"]') || element;
              const titleElement = element.querySelector('[class*="title"], [class*="role"], [class*="position"]');
              const emailElement = element.querySelector('a[href^="mailto:"]');

              const name = getTextContent(nameElement);
              const title = titleElement ? getTextContent(titleElement) : undefined;
              const email = emailElement ? 
                emailElement.getAttribute('href')?.replace('mailto:', '') : 
                findEmail(element);

              if (name && name.length > 0 && name.length < 50 && !name.includes('menu') && !name.includes('nav')) {
                people.push({
                  name,
                  title,
                  email: email || undefined,
                  source: 'website',
                  confidence: 0.9,
                  context: `Found in team section on ${pagePath || 'homepage'}`
                });
              }
            });
          });

          // Process contact page specific elements
          if (pagePath.includes('contact')) {
            document.querySelectorAll('[class*="contact"]:not([class*="form"]):not([class*="button"])').forEach(element => {
              const text = getTextContent(element);
              const email = findEmail(element);
              const nameMatch = text.match(/[A-Z][a-z]+ [A-Z][a-z]+/);

              if (nameMatch && !text.includes('menu') && !text.includes('nav')) {
                people.push({
                  name: nameMatch[0],
                  title: 'Contact',
                  email: email || undefined,
                  source: 'website',
                  confidence: 0.75,
                  context: `Found on contact page`
                });
              }
            });
          }

          return people;
        }, pagePath);

        foundPeople.push(...extractedPeople);
        
      } catch (pageError) {
        console.warn(`Failed to scrape ${pagePath} for ${cleanUrl}:`, pageError instanceof Error ? pageError.message : pageError);
        continue;
      }
    }
    
    // Clean and deduplicate results
    const cleanedPeople = deduplicateAndCleanPeople(foundPeople);
    
    await browser.close();
    
    return {
      people: cleanedPeople,
      scrapingSuccess: cleanedPeople.length > 0,
      method: 'playwright'
    };
    
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    
    console.error('Website scraping failed:', error);
    return {
      people: [],
      scrapingSuccess: false,
      method: 'playwright',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extract people from JSON-LD structured data
 */
function extractPeopleFromJsonLD(data: any): PersonFound[] {
  const people: PersonFound[] = [];

  // Helper function to process a person object
  const processPerson = (person: any) => {
    if (person.name) {
      people.push({
        name: person.name,
        title: person.jobTitle,
        email: person.email,
        source: 'website',
        confidence: 0.95,
        context: 'Found in structured data'
      });
    }
  };

  // Handle different JSON-LD structures
  if (Array.isArray(data)) {
    data.forEach(item => {
      if (item['@type'] === 'Person') {
        processPerson(item);
      }
    });
  } else if (data['@type'] === 'Person') {
    processPerson(data);
  } else if (data['@type'] === 'Organization' && data.employee) {
    const employees = Array.isArray(data.employee) ? data.employee : [data.employee];
    employees.forEach(processPerson);
  }

  return people;
}

/**
 * Clean and deduplicate found people
 */
function deduplicateAndCleanPeople(people: PersonFound[]): PersonFound[] {
  const seen = new Set<string>();
  return people.filter(person => {
    const key = `${person.name}|${person.email || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}