import { NextResponse } from 'next/server';
import { InventoryService } from '@/lib/inventoryService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pharmacyId = searchParams.get('pharmacy_id') || undefined;
    const enquiries = await InventoryService.getEnquiries(pharmacyId);
    return NextResponse.json({ success: true, count: enquiries.length, data: enquiries });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch enquiries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pharmacy_id, pharmacy_name, user_name, user_phone, user_email, medicines, notes } = body;

    if (!pharmacy_id || !user_name || !user_phone || !medicines || !medicines.length) {
      return NextResponse.json({ success: false, error: 'Missing required enquiry fields' }, { status: 400 });
    }

    const enquiry = await InventoryService.createEnquiry({
      pharmacy_id,
      pharmacy_name,
      user_name,
      user_phone,
      user_email: user_email || '',
      medicines,
      notes: notes || ''
    });

    return NextResponse.json({ success: true, data: enquiry });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create enquiry' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'ID and status required' }, { status: 400 });
    }

    const updated = await InventoryService.updateEnquiryStatus(id, status);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update enquiry' }, { status: 500 });
  }
}
