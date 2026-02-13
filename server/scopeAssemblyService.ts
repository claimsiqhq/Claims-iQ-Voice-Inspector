/**
 * Scope Assembly Service
 *
 * Assembles scope items from damage observations, room geometry, and the catalog.
 * Scope defines WHAT work — never touches pricing.
 * Quantities come from room geometry (deterministic), not AI estimation.
 *
 * v2: Trade-based matching instead of damage_type filtering.
 * Damage observations map to relevant trades (e.g., water damage → DRY, PNT, FLR, MIT).
 * Catalog items are selected by trade code, with Gen 1 scopeConditions as bonus filters.
 */

import { IStorage } from "./storage";
import { deriveQuantity, type QuantityFormula, type QuantityResult } from "./scopeQuantityEngine";
import type { InspectionRoom, DamageObservation, ScopeLineItem, ScopeItem, InsertScopeItem } from "@shared/schema";

export interface ScopeAssemblyResult {
  created: ScopeItem[];
  companionItems: ScopeItem[];
  manualQuantityNeeded: Array<{
    catalogCode: string;
    description: string;
    unit: string;
    reason: string;
  }>;
  warnings: string[];
}

interface ScopeConditions {
  damage_types?: string[];
  surfaces?: string[];
  severity?: string[];
  room_types?: string[];
  zone_types?: string[];
}

interface CompanionRules {
  requires?: string[];
  auto_adds?: string[];
  excludes?: string[];
}

const DAMAGE_TYPE_TO_TRADES: Record<string, string[]> = {
  water_stain:     ["DRY", "PNT", "MIT"],
  water_intrusion: ["DRY", "PNT", "FLR", "INS", "MIT", "DEM"],
  mold:            ["DRY", "PNT", "MIT", "DEM", "INS"],
  wind_damage:     ["RFG", "EXT", "WIN", "DRY", "PNT"],
  hail_impact:     ["RFG", "EXT", "WIN", "PNT"],
  crack:           ["DRY", "PNT", "EXT"],
  dent:            ["EXT", "WIN", "CAB"],
  missing:         ["RFG", "EXT", "WIN", "DRY"],
  rot:             ["EXT", "RFG", "DRY", "FLR", "DEM"],
  mechanical:      ["PLM", "ELE", "HVAC"],
  wear_tear:       ["FLR", "CAR", "PNT", "DRY"],
  other:           ["DRY", "PNT", "FLR", "EXT", "RFG"],
};

const ROOM_TYPE_TRADES: Record<string, string[]> = {
  kitchen:    ["CAB", "CTR", "PLM", "ELE", "FLR"],
  bathroom:   ["PLM", "CTR", "FLR", "DRY"],
  bedroom:    ["DRY", "PNT", "FLR", "CAR"],
  living:     ["DRY", "PNT", "FLR", "CAR"],
  garage:     ["DRY", "ELE"],
  exterior:   ["RFG", "EXT", "WIN"],
  roof:       ["RFG"],
  attic:      ["INS", "DRY"],
  basement:   ["DRY", "FLR", "PLM", "MIT"],
  laundry:    ["PLM", "DRY", "FLR"],
};

const DEFAULT_XACT_SELECTORS: Record<string, string[]> = {
  DRY: ["1/2", "1/2+", "TAPE", "PRIM", "TEX"],
  PNT: [],
  FLR: [],
  CAR: [],
  RFG: ["300", "FELT", "DRIP", "FLASH", "RIDGE"],
  EXT: ["FCLP", "HWRAP", "CORNER"],
  WIN: [],
  MIT: [],
  DEM: [],
  INS: [],
  PLM: [],
  ELE: [],
  HVAC: [],
  CAB: [],
  CTR: [],
};

/**
 * Assembles scope items for a damage observation in a room.
 * Uses trade-based matching: damageType → relevant trades → catalog items.
 */
export async function assembleScope(
  storage: IStorage,
  sessionId: number,
  room: InspectionRoom,
  damage: DamageObservation,
  netWallDeduction: number = 0
): Promise<ScopeAssemblyResult> {
  const result: ScopeAssemblyResult = {
    created: [],
    companionItems: [],
    manualQuantityNeeded: [],
    warnings: [],
  };

  const allCatalogItems = await storage.getScopeLineItems();
  const activeCatalog = allCatalogItems.filter(item => item.isActive);

  const matchingItems = findMatchingItems(activeCatalog, damage, room);

  if (matchingItems.length === 0) {
    result.warnings.push(
      `No catalog items found for damage "${damage.damageType}" in "${room.roomType || "unknown"}" room. ` +
      `Items can be added manually via add_line_item.`
    );
    return result;
  }

  const existingScopeItems = await storage.getScopeItems(sessionId);
  const existingCodes = new Set(
    existingScopeItems
      .filter(si => si.roomId === room.id && si.status === "active")
      .map(si => si.catalogCode)
  );

  const pendingCodes = new Set<string>();
  const itemsToCreate: InsertScopeItem[] = [];

  for (const catalogItem of matchingItems) {
    if (existingCodes.has(catalogItem.code)) {
      result.warnings.push(`Skipped "${catalogItem.code}" — already in scope for this room.`);
      continue;
    }

    if (isExcluded(catalogItem.code, existingScopeItems, matchingItems)) {
      result.warnings.push(`Skipped "${catalogItem.code}" — excluded by existing scope item.`);
      continue;
    }

    const formula = catalogItem.quantityFormula as QuantityFormula | null;
    let quantity: number;
    let quantityFormula: string | null = formula;
    const provenance = "damage_triggered";

    if (formula && formula !== "MANUAL") {
      const qResult = deriveQuantity(room, formula, netWallDeduction);
      if (qResult) {
        quantity = qResult.quantity;
      } else {
        result.manualQuantityNeeded.push({
          catalogCode: catalogItem.code,
          description: catalogItem.description,
          unit: catalogItem.unit,
          reason: `Room dimensions required for ${formula} formula`,
        });
        continue;
      }
    } else if (formula === "MANUAL") {
      result.manualQuantityNeeded.push({
        catalogCode: catalogItem.code,
        description: catalogItem.description,
        unit: catalogItem.unit,
        reason: "Manual quantity required",
      });
      continue;
    } else {
      quantity = 1;
      quantityFormula = "EACH";
    }

    if (quantity <= 0) continue;

    pendingCodes.add(catalogItem.code);
    itemsToCreate.push({
      sessionId,
      roomId: room.id,
      damageId: damage.id,
      catalogCode: catalogItem.code,
      description: catalogItem.description,
      tradeCode: catalogItem.tradeCode,
      quantity,
      unit: catalogItem.unit,
      quantityFormula,
      provenance,
      coverageType: catalogItem.coverageType || "A",
      activityType: catalogItem.activityType || "replace",
      wasteFactor: catalogItem.defaultWasteFactor ?? null,
      status: "active",
      parentScopeItemId: null,
    });
  }

  const MAX_COMPANION_DEPTH = 3;

  async function addCompanionsRecursive(
    parentItem: ScopeItem,
    depth: number
  ): Promise<void> {
    if (depth >= MAX_COMPANION_DEPTH) return;

    const catalogItem = activeCatalog.find(c => c.code === parentItem.catalogCode);
    if (!catalogItem?.companionRules) return;

    const companions = catalogItem.companionRules as CompanionRules;
    if (!companions.auto_adds || companions.auto_adds.length === 0) return;

    for (const companionCode of companions.auto_adds) {
      if (existingCodes.has(companionCode) || pendingCodes.has(companionCode)) continue;

      const companionCatalog = activeCatalog.find(c => c.code === companionCode);
      if (!companionCatalog) {
        result.warnings.push(`Companion "${companionCode}" not found in catalog.`);
        continue;
      }

      const cFormula = companionCatalog.quantityFormula as QuantityFormula | null;
      let cQuantity: number;

      if (cFormula && cFormula !== "MANUAL") {
        const cResult = deriveQuantity(room, cFormula, netWallDeduction);
        if (cResult) {
          cQuantity = cResult.quantity;
        } else {
          result.manualQuantityNeeded.push({
            catalogCode: companionCode,
            description: companionCatalog.description,
            unit: companionCatalog.unit,
            reason: `Companion of "${parentItem.catalogCode}" — room dimensions needed`,
          });
          continue;
        }
      } else {
        cQuantity = 1;
      }

      if (cQuantity <= 0) continue;

      pendingCodes.add(companionCode);

      const companionItem = await storage.createScopeItem({
        sessionId,
        roomId: room.id,
        damageId: damage.id,
        catalogCode: companionCode,
        description: companionCatalog.description,
        tradeCode: companionCatalog.tradeCode,
        quantity: cQuantity,
        unit: companionCatalog.unit,
        quantityFormula: companionCatalog.quantityFormula,
        provenance: "companion_auto",
        coverageType: companionCatalog.coverageType || "A",
        activityType: companionCatalog.activityType || "replace",
        wasteFactor: companionCatalog.defaultWasteFactor ?? null,
        status: "active",
        parentScopeItemId: parentItem.id,
      });

      result.companionItems.push(companionItem);
      await addCompanionsRecursive(companionItem, depth + 1);
    }
  }

  if (itemsToCreate.length > 0) {
    const created = await storage.createScopeItems(itemsToCreate);
    result.created.push(...created);

    for (const createdItem of created) {
      await addCompanionsRecursive(createdItem, 0);
    }
  }

  await storage.recalculateScopeSummary(sessionId);

  return result;
}

/**
 * Finds matching catalog items based on damage type and room context.
 *
 * Strategy:
 * 1. Map damageType → relevant trade codes
 * 2. For each trade, find items that match (Gen 1 with scopeConditions, or Xactimate items)
 * 3. Gen 1 items with matching scopeConditions get priority
 * 4. For Xactimate items (no scopeConditions), pick default selectors per trade
 * 5. Only include "install" activity type items (not remove/repair variants)
 */
function findMatchingItems(
  catalog: ScopeLineItem[],
  damage: DamageObservation,
  room: InspectionRoom,
): ScopeLineItem[] {
  const damageType = damage.damageType || "other";
  const severity = damage.severity || "moderate";
  const roomType = room.roomType || "";
  const zoneType = getZoneType(roomType);

  const damageTrades = DAMAGE_TYPE_TO_TRADES[damageType] || DAMAGE_TYPE_TO_TRADES["other"];

  const roomTradeEntry = Object.entries(ROOM_TYPE_TRADES).find(
    ([key]) => roomType.toLowerCase().includes(key)
  );
  const roomTradeSet = roomTradeEntry ? new Set(roomTradeEntry[1]) : null;

  const relevantTrades = roomTradeSet
    ? damageTrades.filter(t => roomTradeSet.has(t) || t === "DRY" || t === "PNT")
    : damageTrades;

  const matched: ScopeLineItem[] = [];
  const seenCodes = new Set<string>();

  for (const tradeCode of relevantTrades) {
    const tradeItems = catalog.filter(item =>
      item.tradeCode === tradeCode && item.isActive
    );

    const gen1Items = tradeItems.filter(item => {
      const conditions = item.scopeConditions as ScopeConditions | null;
      if (!conditions) return false;
      return matchesScopeConditions(conditions, damageType, severity, roomType, zoneType);
    });

    for (const item of gen1Items) {
      if (!seenCodes.has(item.code)) {
        seenCodes.add(item.code);
        matched.push(item);
      }
    }

    if (gen1Items.length === 0) {
      const xactItems = tradeItems.filter(item =>
        !item.scopeConditions &&
        item.xactCategoryCode &&
        item.activityType === "install"
      );

      const defaultSelectors = DEFAULT_XACT_SELECTORS[tradeCode] || [];
      const selectedXact = selectDefaultXactItems(xactItems, tradeCode, defaultSelectors);

      for (const item of selectedXact) {
        if (!seenCodes.has(item.code)) {
          seenCodes.add(item.code);
          matched.push(item);
        }
      }
    }
  }

  return matched;
}

function matchesScopeConditions(
  conditions: ScopeConditions,
  damageType: string,
  severity: string,
  roomType: string,
  zoneType: string,
): boolean {
  const normalizedDamageType = normalizeDamageType(damageType);

  if (conditions.damage_types && conditions.damage_types.length > 0) {
    if (!conditions.damage_types.includes(normalizedDamageType)) {
      return false;
    }
  }

  if (conditions.severity && conditions.severity.length > 0) {
    if (!conditions.severity.includes(severity)) {
      return false;
    }
  }

  if (conditions.room_types && conditions.room_types.length > 0) {
    if (!conditions.room_types.includes(roomType)) {
      return false;
    }
  }

  if (conditions.zone_types && conditions.zone_types.length > 0) {
    if (!conditions.zone_types.includes(zoneType)) {
      return false;
    }
  }

  return true;
}

function normalizeDamageType(damageType: string): string {
  const mapping: Record<string, string> = {
    water_stain: "water",
    water_intrusion: "water",
    wind_damage: "wind",
    hail_impact: "hail",
    wear_tear: "general",
  };
  return mapping[damageType] || damageType;
}

function selectDefaultXactItems(
  items: ScopeLineItem[],
  tradeCode: string,
  defaultSelectors: string[],
): ScopeLineItem[] {
  if (items.length === 0) return [];

  if (defaultSelectors.length === 0) {
    return items.slice(0, 3);
  }

  const selected: ScopeLineItem[] = [];
  for (const selector of defaultSelectors) {
    const selectorLower = selector.toLowerCase();
    const match = items.find(item => {
      const xactSel = (item.xactSelector || "").toLowerCase();
      const code = item.code.toLowerCase();
      return xactSel === selectorLower ||
        xactSel.startsWith(selectorLower) ||
        code.includes(selectorLower);
    });
    if (match) {
      selected.push(match);
    }
  }

  if (selected.length === 0) {
    return items.slice(0, 3);
  }

  return selected;
}

function isExcluded(
  code: string,
  existingItems: ScopeItem[],
  matchingCatalog: ScopeLineItem[]
): boolean {
  for (const item of matchingCatalog) {
    const rules = item.companionRules as CompanionRules | null;
    if (rules?.excludes?.includes(code)) {
      if (existingItems.some(si => si.catalogCode === item.code && si.status === "active")) {
        return true;
      }
    }
  }
  return false;
}

function getZoneType(roomType: string): string {
  if (roomType.startsWith("interior_")) return "interior";
  if (roomType.startsWith("exterior_")) return "exterior";
  return "unknown";
}
