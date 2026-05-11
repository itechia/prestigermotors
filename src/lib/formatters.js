export const formatCurrency = (value) => {
  if (value === null || value === undefined) return "R$ 0,00";
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatMileage = (km) => {
  if (!km) return "0 km";
  return new Intl.NumberFormat('pt-BR').format(km) + " km";
};

export const formatYear = (manufacture, model) => {
  if (!manufacture && !model) return "";
  if (!manufacture) return String(model);
  return `${manufacture}/${model}`;
};

export const fuelLabels = {
  flex: "Flex",
  gasolina: "Gasolina",
  etanol: "Etanol",
  diesel: "Diesel",
  eletrico: "Elétrico",
  hibrido: "Híbrido",
};

export const transmissionLabels = {
  manual: "Manual",
  automatico: "Automático",
  automatizado: "Automatizado",
  cvt: "CVT",
};

export const bodyTypeLabels = {
  sedan: "Sedan",
  hatch: "Hatch",
  suv: "SUV",
  picape: "Picape",
  cupê: "Cupê",
  conversivel: "Conversível",
  minivan: "Minivan",
  utilitario: "Utilitário",
};

export const conditionLabels = {
  novo: "Novo",
  seminovo: "Seminovo",
  usado: "Usado",
};

export const statusLabels = {
  disponivel: "Disponível",
  reservado: "Reservado",
  vendido: "Vendido",
};