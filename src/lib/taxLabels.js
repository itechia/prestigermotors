// Resolve a stored slug/value into a human label.
// Priority: 1) admin-configured taxonomy list, 2) legacy hard-coded label,
// 3) raw value as a fallback so nothing renders as empty.
import { fuelLabels, transmissionLabels, bodyTypeLabels, conditionLabels } from "@/lib/formatters";

export function makeLabelResolver(taxonomyList, legacyMap) {
  const map = new Map();
  (taxonomyList || []).forEach((it) => {
    if (it && it.value) map.set(it.value, it.label);
  });
  return (value) => {
    if (!value) return "";
    if (map.has(value)) return map.get(value);
    if (legacyMap && legacyMap[value]) return legacyMap[value];
    return value;
  };
}

export function buildResolvers(tax) {
  return {
    fuelLabel: makeLabelResolver(tax.fuels, fuelLabels),
    transmissionLabel: makeLabelResolver(tax.transmissions, transmissionLabels),
    categoryLabel: makeLabelResolver(tax.categories, bodyTypeLabels),
    conditionLabel: makeLabelResolver(tax.conditions, conditionLabels),
    colorLabel: makeLabelResolver(tax.colors, null),
    typeLabel: makeLabelResolver(tax.vehicle_types, null),
  };
}