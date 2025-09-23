export function oxford(items) {
  const conj = "and";
  const n = items.length;
  if (n === 1) {
    return items[0];
  } else if (n === 2) {
    return `${items[0]} ${conj} ${items[1]}`;
  } else if (n > 2) {
    return `${items.slice(0, -1).join(", ")}, ${conj} ${items[n - 1]}`;
  } else {
    return "";
  }
}