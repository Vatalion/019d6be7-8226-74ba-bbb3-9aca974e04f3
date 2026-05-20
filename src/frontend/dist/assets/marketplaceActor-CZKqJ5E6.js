function asMarketplaceActor(actor) {
  return actor;
}
function optNat(id) {
  if (id == null || id <= 0) return [];
  return [BigInt(id)];
}
async function searchListingsWithCategory(actor, args) {
  const a = asMarketplaceActor(actor);
  return a.searchListings(
    args.query,
    args.category,
    optNat(args.categoryId),
    args.priceMin,
    args.priceMax,
    args.location,
    args.condition,
    args.shippingCarrier,
    args.offset,
    args.limit,
    args.priceToken
  );
}
export {
  asMarketplaceActor as a,
  optNat as o,
  searchListingsWithCategory as s
};
