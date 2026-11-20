import { NextResponse } from 'next/server';
import { InventoryService } from '@/lib/inventoryService';
import { searchMedicinesCatalog } from '@/lib/searchEngine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const dosageForm = searchParams.get('dosage_form');

    const allMedicines = await InventoryService.getMedicines();

    let medicines: any[] = [];

    if (query.trim()) {
      const scored = searchMedicinesCatalog(query, allMedicines, 0.5);
      medicines = scored.map(s => ({
        ...s.medicine,
        _search_score: s.score,
        _match_type: s.matchType,
        _matched_term: s.matchedTerm
      }));
    } else {
      medicines = allMedicines;
    }

    if (category) {
      medicines = medicines.filter(m => m.category.toLowerCase() === category.toLowerCase());
    }

    if (dosageForm) {
      medicines = medicines.filter(m => m.dosage_form.toLowerCase() === dosageForm.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      query,
      count: medicines.length,
      data: medicines
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch medicines' },
      { status: 500 }
    );
  }
}
