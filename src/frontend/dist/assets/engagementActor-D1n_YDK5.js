function asEngagementActor(actor) {
  return actor;
}
function isResultErr(r) {
  if (r == null || typeof r !== "object") return false;
  const record = r;
  return record.__kind__ === "err" || record.__kind__ === void 0 && "err" in record;
}
export {
  asEngagementActor as a,
  isResultErr as i
};
