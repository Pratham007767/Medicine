import { NextResponse } from 'next/server';
import { InventoryService, calculateDistance } from '@/lib/inventoryService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const medicineId = searchParams.get('medicine_id');
    const maxDistance = searchParams.get('max_distance');

    const pharmacies = await InventoryService.getPharmacies();
    const lat = latParam ? parseFloat(latParam) : undefined;
    const lng = lngParam ? parseFloat(lngParam) : undefined;

    let results = pharmacies.map(pharmacy => {
      let distance_km: number | undefined;
      if (lat !== undefined && lng !== undefined) {
        distance_km = calculateDistance(lat, lng, pharmacy.latitude, pharmacy.longitude);
      }
      return {
        ...pharmacy,
        distance_km
      };
    });

    if (lat !== undefined && lng !== undefined) {
      results.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
    }

    if (maxDistance) {
      const max = parseFloat(maxDistance);
      results = results.filter(p => p.distance_km !== undefined && p.distance_km <= max);
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pharmacies' },
      { status: 500 }
    );
  }
}
