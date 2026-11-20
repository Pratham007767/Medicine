import { NextResponse } from 'next/server';
import { InventoryService } from '@/lib/inventoryService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pharmacyId = searchParams.get('pharmacy_id');
    const medicineId = searchParams.get('medicine_id');
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined;

    if (pharmacyId) {
      const inventory = await InventoryService.getPharmacyInventory(pharmacyId);
      return NextResponse.json({ success: true, count: inventory.length, data: inventory });
    }

    if (medicineId) {
      const stock = await InventoryService.searchPharmacyStockForMedicine(medicineId, {
        userLat: lat,
        userLng: lng
      });
      return NextResponse.json({ success: true, count: stock.length, data: stock });
    }

    const allInventory = await InventoryService.getInventory();
    return NextResponse.json({ success: true, count: allInventory.length, data: allInventory });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pharmacy_id, medicine_id, strength, dosage_form, quantity, price, status, custom_name, custom_brand, custom_generic } = body;

    if (!pharmacy_id || !medicine_id || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required inventory fields (pharmacy_id, medicine_id, quantity)' },
        { status: 400 }
      );
    }

    // Security Check: Only verified pharmacies may publish inventory
    const pharmacy = await InventoryService.getPharmacyById(pharmacy_id);
    if (!pharmacy) {
      return NextResponse.json(
        { success: false, error: 'Pharmacy not found' },
        { status: 404 }
      );
    }

    if (!pharmacy.verified) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only verified pharmacy accounts are permitted to publish stock availability.' },
        { status: 403 }
      );
    }

    const created = await InventoryService.addInventoryItem({
      pharmacy_id,
      medicine_id,
      custom_name,
      custom_brand,
      custom_generic,
      strength: strength || '500mg',
      dosage_form: dosage_form || 'Tablet',
      quantity: Number(quantity),
      price: Number(price) || 0,
      status: status || (Number(quantity) > 0 ? 'in_stock' : 'out_of_stock')
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, quantity, price, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Inventory ID is required' },
        { status: 400 }
      );
    }

    // Security Check: Prevent unauthorized pharmacy inventory changes
    const allItems = await InventoryService.getInventory();
    const existing = allItems.find(i => i.id === id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    const pharmacy = await InventoryService.getPharmacyById(existing.pharmacy_id);
    if (!pharmacy || !pharmacy.verified) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only verified pharmacy accounts are permitted to modify published stock availability.' },
        { status: 403 }
      );
    }

    const updated = await InventoryService.updateInventoryItem(id, {
      quantity: quantity !== undefined ? Number(quantity) : undefined,
      price: price !== undefined ? Number(price) : undefined,
      status
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}
