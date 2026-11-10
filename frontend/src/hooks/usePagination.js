import { useState } from "react";
import { pageSlice } from "../utils/admin";

export function usePagination(rows, resetKey = "") {
    const [state, setState] = useState({ key: resetKey, page: 1 });
    const result = pageSlice(rows, state.key === resetKey ? state.page : 1);
    // Clamp the stored page only when needed, before React commits the result.
    if (state.key !== resetKey || state.page !== result.page) {
        setState({ key: resetKey, page: result.page });
    }
    return { ...result, setPage: (page) => setState({ key: resetKey, page }) };
}
