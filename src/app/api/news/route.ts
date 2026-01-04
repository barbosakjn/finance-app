import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const response = await fetch('https://finance.yahoo.com/news/rssindex', {
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        const xmlText = await response.text();

        // Simple regex-based XML parser for RSS items
        // This is not a full XML parser but sufficient for standard RSS structure
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
        const linkRegex = /<link>(.*?)<\/link>/;
        const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
        // Yahoo RSS often puts images in media:content or description
        const mediaRegex = /<media:content[^>]*url="(.*?)"/;
        const descriptionImgRegex = /<description>[\s\S]*?<img[^>]+src="(.*?)"/;

        let match;
        while ((match = itemRegex.exec(xmlText)) !== null) {
            const itemContent = match[1];

            const titleMatch = titleRegex.exec(itemContent);
            const title = titleMatch ? (titleMatch[1] || titleMatch[2]) : 'No Title';

            const linkMatch = linkRegex.exec(itemContent);
            const link = linkMatch ? linkMatch[1] : '#';

            const pubDateMatch = pubDateRegex.exec(itemContent);
            const pubDate = pubDateMatch ? new Date(pubDateMatch[1]).toLocaleDateString() : '';

            // Try to find an image
            let image = 'https://images.unsplash.com/photo-1611974765270-ca1258634369?w=800&auto=format&fit=crop&q=60'; // Default fallback
            const mediaMatch = mediaRegex.exec(itemContent);
            if (mediaMatch) {
                image = mediaMatch[1];
            } else {
                const descMatch = descriptionImgRegex.exec(itemContent);
                if (descMatch) {
                    image = descMatch[1];
                }
            }

            items.push({
                id: link, // Use link as ID
                title,
                source: "Yahoo Finance",
                image,
                date: pubDate,
                link
            });

            if (items.length >= 10) break; // Limit to 10 items
        }

        return NextResponse.json({ items });
    } catch (error) {
        console.error("Error fetching news:", error);
        return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }
}
