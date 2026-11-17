# Nghiệm thu tích hợp ngày 17/11/2026

- Commit chạy thử do GitHub tạo cho PR #29: `8beb40455b2fa9aaed008717f70413b92305bc85`.
- Commit tích hợp sau merge: `3462458592fc63db8c04486269ad6589a2bae2ce`.
- Hai commit có cùng Git tree `f8b8cd9df618523d9f0e9cb5853c1358c75ed11c`.
- Mã lượt chạy: `431f74dd25ba4ca79bd8d14c4adcc9de`.
- Kết quả: **71 đạt, 0 lỗi**, trong Docker Compose và MySQL thử riêng.
- Lệnh chạy: `./Run-AdminE2E.ps1` từ thư mục gốc.

## Kết quả từng ca

Executed against an isolated MySQL database; not the group's live database.

Pass 71 / Fail 0 / Fatal False

| Case | Result | Reason |
|---|---|---|
| Frontend /admin serves SPA HTML | PASS |  |
| Fixture count poi_db.pois | PASS |  |
| Fixture count audio_db.audio | PASS |  |
| Fixture count localization_db.poi_localizations | PASS |  |
| Seven images and 35 audio URLs serve media through Nginx | PASS |  |
| ADMIN login | PASS |  |
| USER login | PASS |  |
| ADMIN /me | PASS |  |
| Guest cannot register accounts | PASS |  |
| USER cannot register accounts | PASS |  |
| ADMIN creates USER with bcrypt storage | PASS |  |
| Wrong password rejected | PASS |  |
| Guest cannot read Admin catalogue | PASS |  |
| USER cannot read Admin catalogue | PASS |  |
| Tampered token rejected | PASS |  |
| Guest cannot POST /api/pois | PASS |  |
| USER cannot POST /api/pois | PASS |  |
| Guest cannot POST /api/localizations | PASS |  |
| USER cannot POST /api/localizations | PASS |  |
| Guest cannot POST /api/audio | PASS |  |
| USER cannot POST /api/audio | PASS |  |
| Guest cannot GET summary | PASS |  |
| USER cannot GET summary | PASS |  |
| Guest cannot GET devices | PASS |  |
| USER cannot GET devices | PASS |  |
| Guest cannot GET sessions | PASS |  |
| USER cannot GET sessions | PASS |  |
| Guest cannot GET pois/top | PASS |  |
| USER cannot GET pois/top | PASS |  |
| Create POI and verify SQL Unicode/timestamps | PASS |  |
| Duplicate QR returns 409 | PASS |  |
| Invalid coordinates return 400 | PASS |  |
| Omitted imageUrl preserves SQL value | PASS |  |
| Explicit null clears imageUrl | PASS |  |
| INACTIVE hidden from guests, manageable by ADMIN | PASS |  |
| Create localization and verify SQL | PASS |  |
| Update localization and verify SQL | PASS |  |
| Duplicate localization returns 409 | PASS |  |
| Unknown localization POI rejected | PASS |  |
| Create local audio URL and verify SQL | PASS |  |
| Update audio and verify SQL | PASS |  |
| Duplicate audio returns 409 | PASS |  |
| Unknown audio POI rejected | PASS |  |
| Missing duration returns 400 | PASS |  |
| Unsafe audio URL returns 400 | PASS |  |
| INACTIVE content reads enforce parent visibility | PASS |  |
| Category persists and omitted update preserves it | PASS |  |
| Concurrent child create and POI delete leave no orphan | PASS |  |
| Timestamp normalization retains originals and is repeatable | PASS |  |
| Invalid radius 0.99 returns 400 | PASS |  |
| Invalid radius 5000.01 returns 400 | PASS |  |
| Invalid radius 30.123 returns 400 | PASS |  |
| Overlong Unicode POI description returns 400 | PASS |  |
| Missing MP3 returns 404 instead of SPA HTML | PASS |  |
| Analytics rejects unknown POI | PASS |  |
| POI event requires POI ID | PASS |  |
| Invalid query parameter returns 400: /api/localizations?poiId=abc | PASS |  |
| Invalid query parameter returns 400: /api/audio?poiId=abc | PASS |  |
| Invalid query parameter returns 400: /api/analytics/admin/pois/top?limit=abc | PASS |  |
| Delete POI with content returns 409 | PASS |  |
| Seven real device records and current epoch | PASS |  |
| Native session SQL returns populated rows | PASS |  |
| QR landing/POI/history counters separate | PASS |  |
| Test sources excluded consistently | PASS |  |
| audio_play event accepted with metadata | PASS |  |
| Top POI matches SQL | PASS |  |
| Idle device becomes inactive | PASS |  |
| All summary counters equal SQL | PASS |  |
| Delete children then POI, verify SQL removal | PASS |  |
| Nginx rejects analytics body larger than 4 KiB | PASS |  |
| Nginx returns 429 for analytics burst | PASS |  |
