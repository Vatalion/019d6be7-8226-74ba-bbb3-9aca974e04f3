import {
  ShippingCarrier,
  type ShippingMethod,
  type ShippingOption,
  ShippingServiceType,
} from "@/backend.d";

export const PHYSICAL_DELIVERY_LOCKED_TO_PICKUP = true;

export const ACTIVE_PHYSICAL_SHIPPING_CARRIER = ShippingCarrier.self_pickup;

export const DISABLED_PHYSICAL_SHIPPING_CARRIERS: ShippingCarrier[] = [
  ShippingCarrier.nova_poshta,
  ShippingCarrier.ukrposhta,
  ShippingCarrier.meest,
];

export const PICKUP_ONLY_SHIPPING_OPTION: ShippingOption = {
  carrier: ACTIVE_PHYSICAL_SHIPPING_CARRIER,
  cost: 0,
  costNat: 0n,
  deliveryDays: 0n,
  available: true,
};

export function getPhysicalShippingMethods(): ShippingMethod[] {
  return [
    {
      carrier: ACTIVE_PHYSICAL_SHIPPING_CARRIER,
      type: ShippingServiceType.standard,
      estimatedDays: 0n,
    },
  ];
}

export function isDisabledPhysicalShippingCarrier(
  carrier: ShippingCarrier,
): boolean {
  return DISABLED_PHYSICAL_SHIPPING_CARRIERS.includes(carrier);
}
