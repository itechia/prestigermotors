// Endereço público de um veículo. Usa a slug (bonita e estável) e só cai no
// UUID quando o registro ainda não tem slug — links antigos continuam válidos
// porque a rota aceita os dois formatos.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return UUID_RE.test(String(value || ""));
}

export function vehicleKey(vehicle) {
  return vehicle?.slug || vehicle?.id || "";
}

export function vehiclePath(vehicle) {
  const key = vehicleKey(vehicle);
  return key ? `/veiculo/${key}` : "/";
}
