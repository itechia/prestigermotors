import Catalog from "@/views/Catalog";
import { getCachedVehiclesCatalog } from "@/lib/serverPublicData";

export default async function Page() {
  const vehicles = await getCachedVehiclesCatalog();
  return <Catalog initialVehicles={vehicles} />;
}
