import { describe, it, expect, vi } from 'vitest';
import {
  calculateLineItemPrice,
  calculateEstimateTotals,
  validateEstimate,
  getCompanionSuggestions,
  TRADE_CODES,
  type PricedLineItem,
} from '../server/estimateEngine';
import { makeCatalogItem, makeRegionalPrice, makePricedItem } from './mocks/fixtures';

// Mock the db module so lookupCatalogItem / getRegionalPrice don't need a real DB
vi.mock('../server/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
}));

// ─────────────────────────────────────────────────
// TRADE_CODES
// ─────────────────────────────────────────────────
describe('TRADE_CODES', () => {
  it('contains at least 14 base trades', () => {
    expect(TRADE_CODES.length).toBeGreaterThanOrEqual(14);
  });

  it('includes all core trade codes', () => {
    const required = ['MIT', 'DEM', 'DRY', 'PNT', 'FLR', 'INS', 'CAR', 'CAB', 'CTR', 'RFG', 'WIN', 'EXT', 'ELE', 'PLM'];
    for (const code of required) {
      expect(TRADE_CODES).toContain(code);
    }
  });
});

// ─────────────────────────────────────────────────
// calculateLineItemPrice
// ─────────────────────────────────────────────────
describe('calculateLineItemPrice', () => {
  const catalog = makeCatalogItem({ code: 'DRY-12-SF', tradeCode: 'DRY', defaultWasteFactor: 10 });
  const price = makeRegionalPrice({ materialCost: 0.52, laborCost: 0.92, equipmentCost: 0.06 });

  it('calculates unit price = (M + L + E) x (1 + waste%/100)', () => {
    const result = calculateLineItemPrice(catalog, price, 100);
    // Base = 0.52 + 0.92 + 0.06 = 1.50
    // With 10% waste = 1.50 x 1.10 = 1.65
    expect(result.unitPriceBreakdown.unitPrice).toBeCloseTo(1.65, 2);
  });

  it('calculates total price = unitPrice x quantity', () => {
    const result = calculateLineItemPrice(catalog, price, 200);
    expect(result.totalPrice).toBeCloseTo(1.65 * 200, 2);
  });

  it('applies waste factor to each cost component individually', () => {
    const result = calculateLineItemPrice(catalog, price, 1);
    expect(result.unitPriceBreakdown.materialCost).toBeCloseTo(0.52 * 1.10, 4);
    expect(result.unitPriceBreakdown.laborCost).toBeCloseTo(0.92 * 1.10, 4);
    expect(result.unitPriceBreakdown.equipmentCost).toBeCloseTo(0.06 * 1.10, 4);
  });

  it('uses 0 waste when catalog item has no defaultWasteFactor', () => {
    const noWaste = makeCatalogItem({ defaultWasteFactor: 0 });
    const result = calculateLineItemPrice(noWaste, price, 100);
    expect(result.unitPriceBreakdown.wasteFactor).toBe(0);
    expect(result.unitPriceBreakdown.unitPrice).toBeCloseTo(1.50, 2);
  });

  it('allows overriding the waste factor', () => {
    const result = calculateLineItemPrice(catalog, price, 100, 15);
    // 15% waste: 1.50 x 1.15 = 1.725
    expect(result.unitPriceBreakdown.wasteFactor).toBe(15);
    expect(result.unitPriceBreakdown.unitPrice).toBeCloseTo(1.725, 3);
  });

  it('returns correct code, description, unit, tradeCode from catalog', () => {
    const result = calculateLineItemPrice(catalog, price, 50);
    expect(result.code).toBe('DRY-12-SF');
    expect(result.unit).toBe('SF');
    expect(result.tradeCode).toBe('DRY');
  });

  it('handles zero quantity gracefully', () => {
    const result = calculateLineItemPrice(catalog, price, 0);
    expect(result.totalPrice).toBe(0);
    expect(result.quantity).toBe(0);
  });

  it('handles null/missing regional price fields', () => {
    const emptyPrice = { materialCost: null, laborCost: null, equipmentCost: null };
    const result = calculateLineItemPrice(catalog, emptyPrice, 100);
    expect(result.totalPrice).toBe(0);
  });
});

// ─────────────────────────────────────────────────
// calculateEstimateTotals
// ─────────────────────────────────────────────────
describe('calculateEstimateTotals', () => {
  it('sums material, labor, equipment across all items', () => {
    const items: PricedLineItem[] = [
      makePricedItem({ tradeCode: 'DRY', quantity: 100 }),
      makePricedItem({ tradeCode: 'PNT', quantity: 200, code: 'PNT-WALL-SF' }),
    ];
    const totals = calculateEstimateTotals(items);
    expect(totals.subtotalMaterial).toBeGreaterThan(0);
    expect(totals.subtotalLabor).toBeGreaterThan(0);
    expect(totals.subtotal).toBe(totals.subtotalMaterial + totals.subtotalLabor + totals.subtotalEquipment);
  });

  it('calculates tax at the provided rate', () => {
    const items: PricedLineItem[] = [makePricedItem({ tradeCode: 'DRY' })];
    const totals = calculateEstimateTotals(items, 0.10);
    expect(totals.taxAmount).toBeCloseTo(totals.subtotal * 0.10, 2);
  });

  it('defaults to 8% tax when not specified', () => {
    const items: PricedLineItem[] = [makePricedItem({ tradeCode: 'DRY' })];
    const totals = calculateEstimateTotals(items);
    expect(totals.taxAmount).toBeCloseTo(totals.subtotal * 0.08, 2);
  });

  describe('O&P (Overhead & Profit) threshold', () => {
    it('does NOT qualify for O&P with fewer than 3 trades', () => {
      const items: PricedLineItem[] = [
        makePricedItem({ tradeCode: 'DRY' }),
        makePricedItem({ tradeCode: 'PNT', code: 'PNT-WALL-SF' }),
      ];
      const totals = calculateEstimateTotals(items);
      expect(totals.qualifiesForOP).toBe(false);
      expect(totals.overheadAmount).toBe(0);
      expect(totals.profitAmount).toBe(0);
    });

    it('qualifies for O&P with exactly 3 trades', () => {
      const items: PricedLineItem[] = [
        makePricedItem({ tradeCode: 'DRY' }),
        makePricedItem({ tradeCode: 'PNT', code: 'PNT-WALL-SF' }),
        makePricedItem({ tradeCode: 'FLR', code: 'FLR-CAR-SF' }),
      ];
      const totals = calculateEstimateTotals(items);
      expect(totals.qualifiesForOP).toBe(true);
      expect(totals.overheadAmount).toBeCloseTo(totals.subtotal * 0.10, 2);
      expect(totals.profitAmount).toBeCloseTo(totals.subtotal * 0.10, 2);
    });

    it('includes O&P in totalWithOP', () => {
      const items: PricedLineItem[] = [
        makePricedItem({ tradeCode: 'DRY' }),
        makePricedItem({ tradeCode: 'PNT', code: 'PNT-WALL-SF' }),
        makePricedItem({ tradeCode: 'FLR', code: 'FLR-CAR-SF' }),
      ];
      const totals = calculateEstimateTotals(items);
      expect(totals.totalWithOP).toBeCloseTo(
        totals.subtotal + totals.taxAmount + totals.overheadAmount + totals.profitAmount,
        2,
      );
    });

    it('does NOT count duplicate trade codes as separate trades', () => {
      const items: PricedLineItem[] = [
        makePricedItem({ tradeCode: 'DRY', code: 'DRY-12-SF' }),
        makePricedItem({ tradeCode: 'DRY', code: 'DRY-58-SF' }),
        makePricedItem({ tradeCode: 'PNT', code: 'PNT-WALL-SF' }),
      ];
      const totals = calculateEstimateTotals(items);
      // Only 2 unique trades: DRY, PNT -> no O&P
      expect(totals.qualifiesForOP).toBe(false);
      expect(totals.tradesInvolved).toHaveLength(2);
    });
  });

  it('returns empty results for an empty items array', () => {
    const totals = calculateEstimateTotals([]);
    expect(totals.subtotal).toBe(0);
    expect(totals.grandTotal).toBe(0);
    expect(totals.tradesInvolved).toHaveLength(0);
    expect(totals.qualifiesForOP).toBe(false);
  });
});

// ─────────────────────────────────────────────────
// validateEstimate
// ─────────────────────────────────────────────────
describe('validateEstimate', () => {
  it('returns valid when items have no issues', async () => {
    const items: PricedLineItem[] = [
      makePricedItem({ code: 'DRY-12-SF', tradeCode: 'DRY', quantity: 100 }),
    ];
    const result = await validateEstimate(items);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('warns about duplicate item codes', async () => {
    const items: PricedLineItem[] = [
      makePricedItem({ code: 'DRY-12-SF' }),
      makePricedItem({ code: 'DRY-12-SF' }),
    ];
    const result = await validateEstimate(items);
    expect(result.warnings.some((w) => w.includes('Duplicate'))).toBe(true);
  });

  it('warns when DRY present without DEM', async () => {
    const items: PricedLineItem[] = [
      makePricedItem({ code: 'DRY-12-SF', tradeCode: 'DRY' }),
    ];
    const result = await validateEstimate(items);
    expect(result.warnings.some((w) => w.includes('Demolition'))).toBe(true);
  });

  it('warns when PNT present without DRY', async () => {
    const items: PricedLineItem[] = [
      makePricedItem({ code: 'PNT-WALL-SF', tradeCode: 'PNT' }),
    ];
    const result = await validateEstimate(items);
    expect(result.warnings.some((w) => w.includes('Drywall'))).toBe(true);
  });

  it('errors on items with zero quantity', async () => {
    const items: PricedLineItem[] = [
      makePricedItem({ code: 'DRY-12-SF', tradeCode: 'DRY', quantity: 0 }),
    ];
    const result = await validateEstimate(items);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('invalid quantity'))).toBe(true);
  });

  it('errors on items with negative quantity', async () => {
    const items: PricedLineItem[] = [
      makePricedItem({ code: 'DRY-12-SF', tradeCode: 'DRY', quantity: -5 }),
    ];
    const result = await validateEstimate(items);
    expect(result.valid).toBe(false);
  });
});

// ─────────────────────────────────────────────────
// getCompanionSuggestions
// ─────────────────────────────────────────────────
describe('getCompanionSuggestions', () => {
  it('suggests underlayment when roofing is present', async () => {
    const items: PricedLineItem[] = [
      makePricedItem({ code: 'RFG-SHIN-SQ', tradeCode: 'RFG' }),
    ];
    const suggestions = await getCompanionSuggestions(items);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(s => s.includes('RFG-UNDER-SF'))).toBe(true);
  });

  it('suggests tape/compound when drywall is present', async () => {
    const items: PricedLineItem[] = [
      makePricedItem({ code: 'DRY-12-SF', tradeCode: 'DRY' }),
    ];
    const suggestions = await getCompanionSuggestions(items);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(s => s.includes('DRY-TAPE-LF'))).toBe(true);
  });

  it('suggests underlayment when flooring is present', async () => {
    const items: PricedLineItem[] = [
      makePricedItem({ code: 'FLR-CAR-SF', tradeCode: 'FLR' }),
    ];
    const suggestions = await getCompanionSuggestions(items);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(s => s.includes('FLR-PAD-SF'))).toBe(true);
  });

  it('returns no suggestions when nothing triggers companions', async () => {
    const items: PricedLineItem[] = [
      makePricedItem({ code: 'ELE-OUTLET-EA', tradeCode: 'ELE' }),
    ];
    const suggestions = await getCompanionSuggestions(items);
    expect(suggestions).toHaveLength(0);
  });

  it('does not suggest items that already exist in the estimate', async () => {
    const items: PricedLineItem[] = [
      makePricedItem({ code: 'DRY-12-SF', tradeCode: 'DRY' }),
      makePricedItem({ code: 'DRY-TAPE-LF', tradeCode: 'DRY' }),
    ];
    const suggestions = await getCompanionSuggestions(items);
    // Should not re-suggest DRY-TAPE-LF since it's already present
    const suggestionTexts = suggestions.join(' ');
    expect(suggestionTexts).not.toContain('DRY-TAPE-LF');
  });

  it('suggests house wrap when exterior siding is present', async () => {
    const items: PricedLineItem[] = [
      makePricedItem({ code: 'EXT-SIDING-SF', tradeCode: 'EXT' }),
    ];
    const suggestions = await getCompanionSuggestions(items);
    expect(suggestions.some(s => s.includes('EXT-WRAP-SF'))).toBe(true);
  });
});
