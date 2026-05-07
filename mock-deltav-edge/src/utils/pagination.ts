export function paginate<T>(
  items: readonly T[],
  pageNumber: number,
  pageSize: number,
): { readonly items: readonly T[]; readonly total: number; readonly pageNumber: number; readonly pageSize: number } {
  const start = Math.max(0, (pageNumber - 1) * pageSize);
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    pageNumber,
    pageSize,
  };
}
