import { NextResponse } from 'next/server';
import { extractMedicinesFromText } from '@/lib/ocr/prescriptionParser';

// Security constraints
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const MAX_TEXT_LENGTH = 100000; // 100KB text limit to prevent memory abuse

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Case 1: Multipart form upload (File scan)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('prescription') as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No prescription file provided in form data' },
          { status: 400 }
        );
      }

      // 1. Validate file size
      if (file.size <= 0) {
        return NextResponse.json(
          { success: false, error: 'Uploaded file is empty (0 bytes)' },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { success: false, error: `File size exceeds maximum permitted limit of 15MB (Received: ${(file.size / (1024 * 1024)).toFixed(1)}MB)` },
          { status: 400 }
        );
      }

      // 2. Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
        return NextResponse.json(
          { success: false, error: `Invalid file format (${file.type}). Only PDF, JPG, and PNG are permitted.` },
          { status: 400 }
        );
      }

      // 3. Privacy & Sanitization: Ephemeral processing only, no raw disk persistence
      const fileNameLower = file.name.toLowerCase();
      let simulatedOcrText = '';

      if (fileNameLower.includes('cardio') || fileNameLower.includes('heart') || fileNameLower.includes('metformin')) {
        simulatedOcrText = "Metformin HCl 500mg #60 - 1 tab BID with meals\nAtorvastatin 20mg #30 - 1 tab PO at bedtime\nLosartan 50mg #30 - 1 tab daily in morning";
      } else if (fileNameLower.includes('respiratory') || fileNameLower.includes('asthma') || fileNameLower.includes('azithromycin')) {
        simulatedOcrText = "Azithromycin 500mg #6 - 1 tab daily x 5 days\nSalbutamol Inhaler 100mcg #1 - 2 puffs Q4H PRN\n[Handwriting faint: Montel... 10mg?] - 1 tab daily";
      } else {
        simulatedOcrText = "Amoxicillin 500mg capsules #20 - 1 cap TID x 7 days\nParacetamol 650mg tablets #15 - 1 tab Q6H PRN pain\n[Cursive signature unclear: Omep... 20mg caps #14?]";
      }

      const items = extractMedicinesFromText(simulatedOcrText);

      return NextResponse.json({
        success: true,
        filename: file.name,
        file_size: file.size,
        file_type: file.type,
        extracted_count: items.length,
        items,
        disclaimer: 'OCR is an assistive extraction tool and not a clinical diagnosis. Every item must be patient-confirmed before pharmacy querying.'
      });
    }

    // Case 2: Direct JSON payload containing transcribed or pasted text
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Text content string required for extraction' },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Prescription text exceeds maximum allowed size of ${MAX_TEXT_LENGTH} characters` },
        { status: 400 }
      );
    }

    const items = extractMedicinesFromText(text);

    return NextResponse.json({
      success: true,
      extracted_count: items.length,
      items,
      disclaimer: 'OCR is an assistive extraction tool and not a clinical diagnosis. Every item must be patient-confirmed before pharmacy querying.'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'OCR Extraction failed' },
      { status: 500 }
    );
  }
}
