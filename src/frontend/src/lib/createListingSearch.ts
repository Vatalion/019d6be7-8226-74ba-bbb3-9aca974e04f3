export type CreateListingSearch = {
  edit?: string;
};

export function validateCreateListingSearch(
  search: Record<string, unknown>,
): CreateListingSearch {
  const out: CreateListingSearch = {};
  if (typeof search.edit === "string" && search.edit.trim()) {
    out.edit = search.edit.trim();
  } else if (typeof search.edit === "number" && Number.isFinite(search.edit)) {
    out.edit = String(search.edit);
  }
  return out;
}
