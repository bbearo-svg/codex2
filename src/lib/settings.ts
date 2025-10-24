import { prisma } from "@/lib/prisma";

export interface StoreConfiguration {
  taxRate: number;
  deliveryFee: number;
  closedWeekdays: number[];
}

export async function getStoreConfiguration(): Promise<StoreConfiguration> {
  const settings = await prisma.storeSetting.findMany();
  const map = new Map(settings.map((setting) => [setting.key, setting.value] as const));

  return {
    taxRate: Number(map.get("taxRate") ?? process.env.DEFAULT_TAX_RATE ?? 0.0925),
    deliveryFee: Number(map.get("deliveryFee") ?? process.env.DELIVERY_FEE ?? 25),
    closedWeekdays: (map.get("closedWeekdays") ?? "").split(",").filter(Boolean).map((day) => Number(day)),
  };
}
