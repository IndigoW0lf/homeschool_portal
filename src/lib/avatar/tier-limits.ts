// Avatar Design Studio Tier System Configuration
// Defines tier limits, costs, and available features

export type DesignStudioTier = 1 | 2 | 3 | 4;
export type DesignTool = 'fill' | 'draw' | 'eraser' | 'paintbucket';

export interface TierLimits {
  tier: DesignStudioTier;
  name: string;
  maxSavedDesigns: number | 'unlimited';
  availableTools: DesignTool[];
  availableBrushSizes: number[]; // Indexes into BRUSH_SIZES array
  maxMarketplaceListings: number;
  canEquipMultiple: boolean;
  allowedTemplates: string[]; // Template IDs, empty array = all unlocked templates allowed
  icon: string;
  color: string; // CSS color for tier badge
}

export interface TierCost {
  tier: DesignStudioTier;
  moonCost: number;
}

// Tier configuration
export const TIER_LIMITS: Record<DesignStudioTier, TierLimits> = {
  1: {
    tier: 1,
    name: 'Starter',
    maxSavedDesigns: 2,
    availableTools: ['paintbucket'],
    availableBrushSizes: [],
    maxMarketplaceListings: 0,
    canEquipMultiple: false,
    allowedTemplates: [], // Will be filtered by template.unlocked flag
    icon: '🥉',
    color: 'var(--bronze, #CD7F32)',
  },
  2: {
    tier: 2,
    name: 'Creator',
    maxSavedDesigns: 5,
    availableTools: ['paintbucket', 'draw'],
    availableBrushSizes: [0, 1], // Fine, Medium
    maxMarketplaceListings: 0,
    canEquipMultiple: true,
    allowedTemplates: [],
    icon: '🥈',
    color: 'var(--silver, #C0C0C0)',
  },
  3: {
    tier: 3,
    name: 'Designer',
    maxSavedDesigns: 10,
    availableTools: ['paintbucket', 'draw', 'eraser'],
    availableBrushSizes: [0, 1, 2], // Fine, Medium, Thick
    maxMarketplaceListings: 2,
    canEquipMultiple: true,
    allowedTemplates: ['template-synty-full'], // Unlocks full outfit
    icon: '🥇',
    color: 'var(--gold, #FFD700)',
  },
  4: {
    tier: 4,
    name: 'Fashion Master',
    maxSavedDesigns: 'unlimited',
    availableTools: ['paintbucket', 'draw', 'eraser'],
    availableBrushSizes: [0, 1, 2],
    maxMarketplaceListings: 5,
    canEquipMultiple: true,
    allowedTemplates: ['template-synty-full'],
    icon: '💎',
    color: 'var(--platinum, #E5E4E2)',
  },
};

// Tier upgrade costs
export const TIER_COSTS: Record<DesignStudioTier, number> = {
  1: 0, // Free tier
  2: 50,
  3: 150,
  4: 300,
};

/**
 * Get tier limits for a specific tier
 */
export function getTierLimits(tier: DesignStudioTier): TierLimits {
  return TIER_LIMITS[tier];
}

/**
 * Get moon cost to unlock a specific tier
 */
export function getTierCost(targetTier: DesignStudioTier): number {
  return TIER_COSTS[targetTier];
}

/**
 * Check if a tool is available at a given tier
 */
export function isToolAvailable(tier: DesignStudioTier, tool: DesignTool): boolean {
  const limits = getTierLimits(tier);
  return limits.availableTools.includes(tool);
}

/**
 * Check if a template is available at a given tier
 * @param tier - Current tier level
 * @param templateId - Template ID to check
 * @param isTemplateUnlocked - Whether the base template is unlocked (from template.unlocked)
 */
export function isTemplateAvailable(
  tier: DesignStudioTier,
  templateId: string,
  isTemplateUnlocked: boolean
): boolean {
  // Template must be unlocked first (via shop or starter)
  if (!isTemplateUnlocked) return false;
  
  const limits = getTierLimits(tier);
  
  // If no restrictions, all unlocked templates are available
  if (limits.allowedTemplates.length === 0) return true;
  
  // Check if template is in allowed list
  return limits.allowedTemplates.includes(templateId);
}

/**
 * Get the next tier and its cost
 */
export function getNextTierInfo(currentTier: DesignStudioTier): {
  nextTier: DesignStudioTier | null;
  cost: number;
  limits: TierLimits | null;
} {
  if (currentTier >= 4) {
    return { nextTier: null, cost: 0, limits: null };
  }
  
  const nextTier = (currentTier + 1) as DesignStudioTier;
  return {
    nextTier,
    cost: getTierCost(nextTier),
    limits: getTierLimits(nextTier),
  };
}

/**
 * Check if a kid can save a new design based on current count and tier
 */
export function canSaveDesign(
  currentTier: DesignStudioTier,
  currentDesignCount: number
): boolean {
  const limits = getTierLimits(currentTier);
  if (limits.maxSavedDesigns === 'unlimited') return true;
  return currentDesignCount < limits.maxSavedDesigns;
}

/**
 * Get available brush sizes for a tier
 */
export function getAvailableBrushSizes(tier: DesignStudioTier): number[] {
  return getTierLimits(tier).availableBrushSizes;
}
