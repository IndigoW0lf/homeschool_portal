import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// pdf-parse has CJS issues - use dynamic require
async function parsePdf(buffer: Buffer): Promise<{ text: string; numpages: number; info: Record<string, unknown> }> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse');
  return pdfParse(buffer);
}

/**
 * POST /api/parse-pdf
 * 
 * Extracts text content from an uploaded PDF file.
 * Used for importing MiAcademy report cards.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the PDF file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF to text
    const pdfData = await parsePdf(buffer);
    const text = pdfData.text;

    return NextResponse.json({
      success: true,
      text: text,
      pages: pdfData.numpages,
      info: pdfData.info,
    });
  } catch (error) {
    console.error('PDF parse error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}
