import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const resumeUrl = searchParams.get('url');

        console.log('📄 Resume proxy request:', resumeUrl);

        if (!resumeUrl) {
            return NextResponse.json({ error: 'Resume URL is required' }, { status: 400 });
        }

        // Fetch the file from Cloudinary
        console.log('🔄 Fetching from Cloudinary...');
        const response = await fetch(resumeUrl);

        console.log('📊 Cloudinary response status:', response.status);
        console.log('📊 Cloudinary response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Cloudinary fetch failed:', response.status, errorText);
            throw new Error(`Failed to fetch resume: ${response.status} - ${errorText}`);
        }

        const buffer = await response.arrayBuffer();
        console.log('✅ Successfully fetched resume, size:', buffer.byteLength);

        // Return the PDF with proper headers for inline viewing
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline',
                'Cache-Control': 'public, max-age=31536000',
            },
        });
    } catch (error: any) {
        console.error('❌ Error serving resume:', error);
        return NextResponse.json(
            { error: 'Failed to load resume', details: error.message },
            { status: 500 }
        );
    }
}
