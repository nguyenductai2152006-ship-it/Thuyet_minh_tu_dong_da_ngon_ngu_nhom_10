export default function Pagination({ data, label, disabled = false }) {
    const { page, pageCount, total, from, to, setPage } = data;
    const first = Math.max(1, Math.min(page - 2, pageCount - 4));
    const pages = Array.from({ length: Math.min(5, pageCount) }, (_, i) => first + i);
    return (
        <nav className="hag-pagination" aria-label={`Phân trang ${label}`}>
            <span role="status" aria-live="polite">{from}–{to} / {total} dòng · 5 dòng/trang</span>
            <div className="hag-pagination__buttons">
                <button type="button" disabled={disabled || page === 1} onClick={() => setPage(1)} aria-label={`Trang đầu ${label}`}>«</button>
                <button type="button" disabled={disabled || page === 1} onClick={() => setPage(page - 1)} aria-label={`Trang trước ${label}`}>‹</button>
                {pages.map((number) => <button key={number} type="button" disabled={disabled || !total} aria-current={number === page ? "page" : undefined} onClick={() => setPage(number)}>{number}</button>)}
                <button type="button" disabled={disabled || page === pageCount} onClick={() => setPage(page + 1)} aria-label={`Trang sau ${label}`}>›</button>
                <button type="button" disabled={disabled || page === pageCount} onClick={() => setPage(pageCount)} aria-label={`Trang cuối ${label}`}>»</button>
            </div>
        </nav>
    );
}
