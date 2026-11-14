// Shared accent-insensitive search for visitor and administration screens.
export function normalizeSearch(value) {
    return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/gi, "d").toLowerCase().trim();
}
