function asSet(value) {
  if (value instanceof Set) return value;
  return new Set(value || []);
}

export function buildShoppingView({
  serverItems = [],
  optimisticItems = [],
  overrides = {},
  hiddenIds = new Set(),
  showBoughtItems = false,
  selectedFilterTags = []
}) {
  const hidden = asSet(hiddenIds);
  const serverIds = new Set(serverItems.map((item) => item.id));
  const pending = optimisticItems.filter((item) => !serverIds.has(item.id));
  const items = [
    ...pending,
    ...serverItems.map((item) => (
      overrides[item.id] ? { ...item, ...overrides[item.id] } : item
    ))
  ].filter((item) => !hidden.has(item.id));

  const allTags = Array.from(new Set(items.flatMap((item) => item.tags || [])));
  const filteredItems = items
    .filter((item) => (showBoughtItems ? true : !item.isBought))
    .filter((item) => (
      selectedFilterTags.length === 0
      || selectedFilterTags.every((tag) => item.tags?.includes(tag))
    ));

  return {
    items,
    filteredItems,
    allTags,
    boughtCount: items.filter((item) => item.isBought).length
  };
}
