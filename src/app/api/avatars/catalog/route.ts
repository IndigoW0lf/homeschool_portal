import { NextResponse } from 'next/server';
import avatarCatalog from '../../../../../content/purchasable-avatars.json';

interface AvatarItem {
  id: string;
  name: string;
  svgPath: string;
  cost: number;
  isFree: boolean;
}

interface CatalogResponse {
  upper: AvatarItem[];
  standing: AvatarItem[];
  sitting: AvatarItem[];
  special: AvatarItem[];
  medical: AvatarItem[];
  designStudio: {
    id: string;
    name: string;
    description: string;
    cost: number;
    type: string;
  };
}

/**
 * GET /api/avatars/catalog
 * Returns the full avatar catalog
 */
export async function GET() {
  const catalog = avatarCatalog as CatalogResponse;
  
  // Calculate totals for each category
  const totals = {
    upper: catalog.upper.length,
    standing: catalog.standing.length,
    sitting: catalog.sitting.length,
    special: catalog.special.length,
    medical: catalog.medical.length,
    total: catalog.upper.length + catalog.standing.length + catalog.sitting.length + catalog.special.length + catalog.medical.length,
  };

  return NextResponse.json({
    catalog,
    totals,
  });
}
