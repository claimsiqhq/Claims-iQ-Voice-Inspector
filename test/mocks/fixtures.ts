/**
 * Mock catalog item — matches the shape returned by db.select().from(scopeLineItems)
 */
export function makeCatalogItem(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    code: 'DRY-12-SF',
    description: '1/2" drywall - hung, taped, floated, ready for paint',
    unit: 'SF',
    tradeCode: 'DRY',
    defaultWasteFactor: 10,
    laborMinimum: null,
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Mock regional price — matches the shape returned by db.select().from(regionalPriceSets)
 */
export function makeRegionalPrice(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    lineItemCode: 'DRY-12-SF',
    regionId: 'US_NATIONAL',
    materialCost: 0.52,
    laborCost: 0.92,
    equipmentCost: 0.06,
    totalUnitPrice: 1.50,
    effectiveDate: '2025-01-01',
    source: 'verisk',
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Helper to build a PricedLineItem for calculateEstimateTotals tests.
 * Accepts just the fields that matter for totals calculation.
 */
export function makePricedItem(overrides: Record<string, any> = {}) {
  return {
    code: 'DRY-12-SF',
    description: '1/2" drywall',
    unit: 'SF',
    quantity: 100,
    unitPriceBreakdown: {
      materialCost: 0.572,   // 0.52 * 1.10 (10% waste)
      laborCost: 1.012,      // 0.92 * 1.10
      equipmentCost: 0.066,  // 0.06 * 1.10
      wasteFactor: 10,
      unitPrice: 1.65,       // (0.52+0.92+0.06) * 1.10
    },
    totalPrice: 165.0,       // 1.65 * 100
    tradeCode: 'DRY',
    ...overrides,
  };
}

/**
 * Mock claim object
 */
export function makeClaim(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    claimNumber: 'CLM-2025-001',
    insuredName: 'Jane Smith',
    propertyAddress: '123 Main St',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    dateOfLoss: '2025-01-15',
    perilType: 'water',
    status: 'in_progress',
    createdAt: new Date(),
    assignedTo: 'user-1',
    ...overrides,
  };
}

/**
 * Mock inspection session
 */
export function makeSession(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    claimId: 1,
    status: 'active',
    currentPhase: 1,
    currentRoomId: null,
    startedAt: new Date(),
    completedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Mock inspection room
 */
export function makeRoom(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    sessionId: 1,
    name: 'Kitchen',
    structure: 'Main',
    roomType: 'kitchen',
    status: 'completed',
    dimensions: { length: 12, width: 10, height: 8 },
    damageCount: 2,
    photoCount: 3,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Mock line item (as stored in DB)
 */
export function makeLineItem(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    sessionId: 1,
    roomId: 1,
    description: '1/2" drywall - hung, taped, floated',
    category: 'Drywall',
    action: 'R&R',
    quantity: 100,
    unit: 'SF',
    unitPrice: 1.65,
    totalPrice: 165.0,
    xactCode: 'DRY-12-SF',
    depreciation: 16.5,
    depreciationType: 'Recoverable',
    source: 'voice_agent',
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Mock damage observation
 */
export function makeDamage(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    roomId: 1,
    sessionId: 1,
    description: 'Water staining on ceiling drywall',
    damageType: 'water_damage',
    severity: 'moderate',
    location: 'ceiling',
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Mock photo
 */
export function makePhoto(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    sessionId: 1,
    roomId: 1,
    caption: 'Water damage on ceiling',
    photoType: 'damage_detail',
    storagePath: '/photos/1.jpg',
    analysis: { description: 'Visible water staining on drywall ceiling' },
    autoTag: 'water_damage',
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Mock moisture reading
 */
export function makeMoistureReading(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    roomId: 1,
    sessionId: 1,
    location: 'North wall, 2ft from floor',
    materialType: 'drywall',
    reading: 28.5,
    dryStandard: 15,
    isElevated: true,
    createdAt: new Date(),
    ...overrides,
  };
}
