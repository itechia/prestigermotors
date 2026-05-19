// Builds a rich WhatsApp message for a vehicle, including the public link
// and details so WhatsApp shows a link preview (cover image) automatically.
import { formatCurrency, formatMileage, formatYear } from "@/lib/formatters";

// Returns the absolute, shareable URL of a vehicle (front-end origin).
export function buildVehicleUrl(vehicle) {
  if (typeof window === "undefined" || !vehicle?.id) return "";
  return `${window.location.origin}/veiculo/${vehicle.id}`;
}

// Builds a multi-line message. Putting the link on its own line lets
// WhatsApp generate the link preview card (with cover image + title).
export function buildVehicleWhatsAppMessage(vehicle) {
  if (!vehicle) return "";

  const url = buildVehicleUrl(vehicle);
  const title = `${vehicle.brand || ""} ${vehicle.model || ""}`.trim();
  const yearStr = formatYear(vehicle.manufacture_year, vehicle.year);

  const lines = [];
  lines.push(`Olá! Tenho interesse neste veículo:`);
  lines.push("");
  lines.push(`*${title}${vehicle.version ? " " + vehicle.version : ""}*`);
  if (yearStr) lines.push(`📅 Ano: ${yearStr}`);
  if (vehicle.mileage) lines.push(`🛣️ KM: ${formatMileage(vehicle.mileage)}`);
  if (vehicle.fuel_type) lines.push(`⛽ Combustível: ${vehicle.fuel_type}`);
  if (vehicle.transmission) lines.push(`⚙️ Câmbio: ${vehicle.transmission}`);
  if (vehicle.color) lines.push(`🎨 Cor: ${vehicle.color}`);
  if (vehicle.price) lines.push(`💰 Preço: ${formatCurrency(vehicle.price)}`);
  if (url) {
    lines.push("");
    lines.push(`🔗 ${url}`);
  }
  lines.push("");
  lines.push(`Pode me passar mais informações?`);

  return lines.join("\n");
}

export function buildVehicleShareText(vehicle, settings = {}, { includeUrl = false } = {}) {
  if (!vehicle) return "";

  const storeName = settings.store_name || "loja";
  const title = `${vehicle.brand || ""} ${vehicle.model || ""}`.trim();
  const version = vehicle.version ? ` ${vehicle.version}` : "";
  const yearStr = formatYear(vehicle.manufacture_year, vehicle.year);
  const specs = [
    yearStr ? `Ano ${yearStr}` : "",
    vehicle.mileage ? formatMileage(vehicle.mileage) : "",
    vehicle.fuel_type || "",
    vehicle.transmission || "",
  ].filter(Boolean);

  const lines = [
    `Olha o que eu encontrei no site da ${storeName}:`,
    "",
    `${title}${version}`,
  ];

  if (specs.length) lines.push(specs.join(" • "));
  if (vehicle.price) lines.push(formatCurrency(vehicle.price));
  if (includeUrl) {
    const url = buildVehicleUrl(vehicle);
    if (url) {
      lines.push("");
      lines.push(url);
    }
  }

  return lines.join("\n");
}

// Returns the full https://wa.me/... URL ready to be opened.
export function buildWhatsAppHref(whatsappNumber, vehicle) {
  const number = String(whatsappNumber || "").replace(/\D/g, "");
  const text = encodeURIComponent(buildVehicleWhatsAppMessage(vehicle));
  return `https://wa.me/${number}?text=${text}`;
}
