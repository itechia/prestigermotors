// Real metadata derived from vehicle fields. No fake numbers.

function daysBetween(dateStr) {
  if (!dateStr) return 0;
  const then = new Date(dateStr);
  if (Number.isNaN(then.getTime())) return 0;
  const diffMs = Date.now() - then.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function getVehicleMeta(vehicle) {
  if (!vehicle) return null;

  // Prefer the admin-set listed_date; fall back to the record creation date.
  const sourceDate = vehicle.listed_date || vehicle.created_date;
  const daysOnLot = daysBetween(sourceDate);

  // Stock — defaults to 1 when not set, so legacy vehicles still show "última unidade".
  const stock = Number.isFinite(vehicle.stock_quantity) ? vehicle.stock_quantity : 1;
  const lowStock = stock > 0 && stock <= 1;

  return {
    daysOnLot,
    stock,
    lowStock,
  };
}