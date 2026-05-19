export const VEHICLE_EXPORT_COLUMNS = [
  { key: "id", header: "ID" },
  { key: "vehicle_type", header: "Tipo de veiculo" },
  { key: "brand", header: "Marca" },
  { key: "model", header: "Modelo" },
  { key: "version", header: "Versao" },
  { key: "year", header: "Ano modelo", type: "number" },
  { key: "manufacture_year", header: "Ano fabricacao", type: "number" },
  { key: "price", header: "Preco", type: "number" },
  { key: "price_old", header: "Preco anterior", type: "number" },
  { key: "mileage", header: "Quilometragem", type: "number" },
  { key: "fuel_type", header: "Combustivel" },
  { key: "transmission", header: "Cambio" },
  { key: "color", header: "Cor" },
  { key: "body_type", header: "Carroceria" },
  { key: "condition", header: "Condicao" },
  { key: "status", header: "Status" },
  { key: "featured", header: "Destaque", type: "boolean" },
  { key: "hidden", header: "Oculto", type: "boolean" },
  { key: "stock_quantity", header: "Quantidade em estoque", type: "number" },
  { key: "doors", header: "Portas", type: "number" },
  { key: "engine", header: "Motor" },
  { key: "listed_date", header: "Data do anuncio" },
  { key: "description", header: "Descricao" },
  { key: "features", header: "Itens e opcionais" },
  { key: "images", header: "Imagens" },
  { key: "embed_html", header: "HTML 360" },
];

export const SALES_EXPORT_COLUMNS = [
  { key: "id", header: "ID" },
  { key: "sold_at", header: "Data da venda" },
  { key: "vehicle_id", header: "ID do veiculo" },
  { key: "vehicle", header: "Veiculo" },
  { key: "seller_id", header: "ID do vendedor" },
  { key: "seller", header: "Vendedor" },
  { key: "quantity", header: "Quantidade", type: "number" },
  { key: "sale_price", header: "Valor unitario", type: "number" },
  { key: "total", header: "Valor total", type: "number" },
  { key: "customer_name", header: "Cliente" },
  { key: "customer_phone", header: "Telefone do cliente" },
  { key: "payment_method", header: "Forma de pagamento" },
  { key: "notes", header: "Observacoes" },
  { key: "created_date", header: "Data de criacao" },
];

export function normalizeVehicleImportRow(row) {
  const headerToKey = new Map(
    VEHICLE_EXPORT_COLUMNS.flatMap((column) => [
      [column.key.toLowerCase(), column.key],
      [column.header.toLowerCase(), column.key],
    ])
  );

  return Object.fromEntries(
    Object.entries(row).map(([header, value]) => [
      headerToKey.get(String(header).trim().toLowerCase()) || header,
      value,
    ])
  );
}
