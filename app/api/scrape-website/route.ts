import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsiteForPeople, type WebsiteScrapingResult } from '@/lib/website-scraper-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { websiteUrl, usePlaywright = false } = body;

    if (!websiteUrl) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const result: WebsiteScrapingResult = await scrapeWebsiteForPeople(websiteUrl, usePlaywright);

    return NextResponse.json({
      success: result.scrapingSuccess,
      people: result.people,
      method: result.method,
      summary: {
        totalFound: result.people.length,
        highConfidence: result.people.filter(p => p.confidence >= 0.8).length,
        withEmails: result.people.filter(p => p.email).length,
        withTitles: result.people.filter(p => p.title).length
      },
      error: result.error
    });

  } catch (error) {
    console.error('Scraping API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to scrape website',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint for testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testUrl = searchParams.get('url');
  
  if (!testUrl) {
    return NextResponse.json({ error: 'Add ?url=example.com to test' }, { status: 400 });
  }

  try {
    const result = await scrapeWebsiteForPeople(testUrl, false);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Scraping failed' }, { status: 500 });
  }
}