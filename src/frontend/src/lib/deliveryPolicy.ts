import {
  ShippingCarrier,
  type ShippingMethod,
  type ShippingOption,
  ShippingServiceType,
} from "@/backend.d";

/** E7.S3: Nova Poshta is the only user-facing physical carrier in Phase 1.5. */
export const PHYSICAL_DELIVERY_LOCKED_TO_PICKUP = false;

export const ACTIVE_PHYSICAL_SHIPPING_CARRIER = ShippingCarrier.nova_poshta;

/** Carriers hidden from listing/trade UI until owner approves a broader contract. */
export const DISABLED_PHYSICAL_SHIPPING_CARRIERS: ShippingCarrier[] = [
  ShippingCarrier.self_pickup,
  ShippingCarrier.ukrposhta,
  ShippingCarrier.meest,
];

export const NOVA_POSHTA_SHIPPING_OPTION: ShippingOption = {
  carrier: ACTIVE_PHYSICAL_SHIPPING_CARRIER,
  cost: 0,
  costNat: 0n,
  deliveryDays: 3n,
  available: true,
};

/** @deprecated Use NOVA_POSHTA_SHIPPING_OPTION — kept for import stability. */
export const PICKUP_ONLY_SHIPPING_OPTION = NOVA_POSHTA_SHIPPING_OPTION;

export function getPhysicalShippingMethods(): ShippingMethod[] {
  return [
    {
      carrier: ACTIVE_PHYSICAL_SHIPPING_CARRIER,
      type: ShippingServiceType.standard,
      estimatedDays: 3n,
    },
  ];
}

export function isDisabledPhysicalShippingCarrier(
  carrier: ShippingCarrier,
): boolean {
  return DISABLED_PHYSICAL_SHIPPING_CARRIERS.includes(carrier);
}

export function isEnabledPhysicalShippingCarrier(
  carrier: ShippingCarrier,
): boolean {
  return carrier === ACTIVE_PHYSICAL_SHIPPING_CARRIER;
}
