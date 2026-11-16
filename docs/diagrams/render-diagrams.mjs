import fs from 'node:fs';

const folder = new URL('./', import.meta.url);
const ink = '#26374d';
const blue = '#225f90';
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
let drawing;

function label(x, y, value, { size = 18, anchor = 'start', weight = 400, color = ink } = {}) {
    value.split('\n').forEach((line, i) => {
        drawing.push(`<text x="${x}" y="${y + i * (size + 6)}" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}" fill="${color}">${escape(line)}</text>`);
    });
}

function rect(x, y, w, h, fill, stroke = blue, radius = 12) {
    drawing.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`);
}

function box(x, y, w, h, title, sub = '', kind = 'process') {
    const fill = { process: '#eaf4fd', actor: '#fff0d4', store: '#eaf6ef' }[kind];
    rect(x, y, w, h, fill, blue, kind === 'actor' ? 3 : 12);
    if (kind === 'store') drawing.push(`<path d="M${x + 12} ${y}v${h}" stroke="${blue}" stroke-width="2"/>`);
    label(x + w / 2, y + (sub ? 29 : h / 2 + 6), title, { anchor: 'middle', weight: 700 });
    if (sub) label(x + w / 2, y + 54, sub, { anchor: 'middle', size: 15 });
}

function line(path, { arrow = true, dashed = false } = {}) {
    drawing.push(`<path d="${path}" fill="none" stroke="${blue}" stroke-width="2" ${arrow ? 'marker-end="url(#arrow)"' : ''} ${dashed ? 'stroke-dasharray="7 5"' : ''}/>`);
}

function diagram(file, title, sub, w, h, draw) {
    drawing = [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><title>${escape(title)}</title>`,
        `<defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z" fill="${blue}"/></marker></defs>`,
        '<rect width="100%" height="100%" fill="#fff"/>',
        '<g font-family="Segoe UI, Arial, sans-serif">',
    ];
    label(36, 49, title, { size: 31, weight: 750 });
    label(37, 80, sub, { size: 16 });
    draw();
    fs.writeFileSync(new URL(file + '.svg', folder), drawing.join('\n') + '\n</g></svg>\n');
}

diagram('01-tong-quat', 'Kiến trúc tổng quát', 'Hệ thống thuyết minh tự động đa ngôn ngữ • Nhóm 10', 1240, 665, () => {
    box(180, 120, 290, 62, 'Khách tham quan', '', 'actor');
    box(770, 120, 290, 62, 'Quản trị viên', '', 'actor');
    line('M325 182V206H545V226');
    line('M915 182V206H695V226');
    box(370, 226, 500, 76, 'Frontend React và Nginx', 'Trang khách, /admin, ảnh và tệp audio');
    line('M620 302V345');
    label(638, 330, '/api', { size: 15 });
    box(410, 345, 420, 60, 'API Gateway');
    const services = [
        ['Identity Service', 'identity_db.users'],
        ['POI Service + Analytics', 'poi_db.pois và analytics_events'],
        ['Localization Service', 'localization_db.poi_localizations'],
        ['Audio Service', 'audio_db.audio'],
    ];
    services.forEach(([title, sub], i) => {
        const x = 35 + i * 295;
        line(`M${470 + i * 100} 405V${425 + i * 9}H${x + 142}V480`);
        box(x, 480, 285, 76, title, sub);
    });
    rect(90, 595, 1060, 43, '#eaf6ef');
    services.forEach((_, i) => line(`M${177 + i * 295} 556V595`));
    label(620, 622, 'Một MySQL 8 • bốn schema nghiệp vụ', { anchor: 'middle', weight: 700 });
});

// DFD symbols follow the supplied reference: circle and curved-sided store.
function dfdProcess(x, y, radius, id, title) {
    drawing.push(`<circle cx="${x}" cy="${y}" r="${radius}" fill="#eaf4fd" stroke="${blue}" stroke-width="2"/>`);
    const count = title.split('\n').length;
    label(x, y + 5 - count * 10, id + '\n' + title, { anchor: 'middle', size: 14, weight: 700 });
    return (atY, side) => Math.round(x + side * Math.sqrt(radius ** 2 - (atY - y) ** 2));
}

function dfdStore(x, y, w, h, id, title) {
    drawing.push(`<path d="M${x} ${y}H${x + w} Q${x + w - 18} ${y + h / 2} ${x + w} ${y + h}H${x} Q${x - 18} ${y + h / 2} ${x} ${y}Z" fill="#eaf6ef" stroke="${blue}" stroke-width="2"/>`);
    label(x + 19, y + h / 2 + 5, id, { anchor: 'middle', size: 14, weight: 700 });
    label(x + 49, y + h / 2 + 5, title, { size: 15, weight: 700 });
}

diagram('02-dfd-ngu-canh', 'DFD ngữ cảnh', 'Phạm vi nghiệp vụ theo Use Case tổng quát', 1240, 470, () => {
    box(35, 231, 200, 60, 'Khách tham quan', '', 'actor');
    dfdProcess(620, 263, 87, '0', 'Hệ thống thuyết minh\ntự động đa ngôn ngữ');
    box(1005, 231, 200, 60, 'Quản trị viên', '', 'actor');
    line('M135 231V155H574V189');
    label(342, 116, 'Mã QR, địa điểm, ngôn ngữ, vị trí, câu hỏi\nvà sự kiện sử dụng', { anchor: 'middle', size: 15 });
    line('M574 337V367H135V291');
    label(337, 392, 'Danh mục, bản dịch, audio, bản đồ và trả lời tra cứu', { anchor: 'middle', size: 15 });
    line('M1105 231V155H666V189');
    label(897, 116, 'Thông tin đăng nhập, yêu cầu quản lý và thống kê\nkèm token khi cần xác thực', { anchor: 'middle', size: 15 });
    line('M666 337V367H1105V291');
    label(902, 392, 'Kết quả xác thực (JWT), cập nhật và số liệu thống kê', { anchor: 'middle', size: 15 });
    label(620, 442, 'Khách tham quan = Visitor  •  Quản trị viên = ADMIN', { anchor: 'middle', size: 16 });
});

diagram('03-dfd-phan-ra', 'DFD phân rã tiến trình 0', 'Tác nhân hình chữ nhật • Tiến trình hình tròn • Kho dữ liệu cạnh cong', 1480, 1105, () => {
    const rows = [
        ['Quản trị viên', '1. Xác thực', 'D1 • users', 'Thông tin đăng nhập', 'Kết quả xác thực (JWT)', 'Tra tài khoản', 'Tài khoản và vai trò'],
        ['Khách tham quan', '2. Khám phá POI', 'D2 • pois', 'Mã QR, tiêu chí tìm kiếm', 'Danh mục, ID và chi tiết POI', 'Tra POI', 'Thông tin POI'],
        ['Khách tham quan', '3. Cung cấp thuyết minh', 'D3 • poi_localizations', 'POI đã chọn, ngôn ngữ', 'Bản dịch và nội dung audio', 'POI, mã ngôn ngữ', 'Tên và mô tả đã dịch'],
        ['Khách tham quan', '4. Bản đồ, GPS và tra cứu', 'D2 • pois', 'Vị trí, câu hỏi, điểm chọn', 'Ghim, điểm gần, câu trả lời', 'Danh mục và tọa độ', 'Dữ liệu POI'],
        ['Quản trị viên', '5. Quản lý nội dung', 'D2 / D3 / D4', 'JWT và dữ liệu CRUD', 'Danh sách và kết quả cập nhật', 'Đọc / ghi nội dung', 'Dữ liệu hoặc kết quả lưu'],
        ['Khách tham quan', '6. Ghi sự kiện và thống kê', 'D5 • analytics_events', 'Sự kiện sử dụng', '', 'Ghi sự kiện, đọc tổng hợp', 'Sự kiện và số liệu'],
    ];
    const processNames = ['Xác thực', 'Khám phá POI', 'Cung cấp\nthuyết minh', 'Bản đồ, GPS\nvà tra cứu', 'Quản lý\nnội dung', 'Ghi sự kiện\nvà thống kê'];
    const edges = [];
    rows.forEach(([actor, proc, store, request, response, query, result], i) => {
        const y = [113, 242, 371, 525, 690, 819][i];
        box(30, y, 220, 60, actor, '', 'actor');
        const edge = dfdProcess(733, i === 4 ? 721 : y + 30, i === 4 ? 72 : 51, (i + 1) + '.0', processNames[i]);
        edges.push(edge);
        line(`M250 ${y + 18}H${edge(y + 18, -1)}`);
        if (response) line(`M${edge(y + 45, -1)} ${y + 45}H250`);
        const flows = [[414, 13, request], [414, 69, response]];
        if (i !== 4) {
            dfdStore(1210, y, 235, 60, ...store.split(' • '));
            line(`M${edge(y + 26, 1)} ${y + 26}H1202`);
            line(`M1202 ${y + 48}H${edge(y + 48, 1)}`);
            flows.push([1049, 20, query], [1049, 69, result]);
        }
        for (const [x, offset, value] of flows) {
            label(x, y + offset, value, { anchor: 'middle', size: 15 });
        }
    });
    dfdStore(1210, 458, 235, 42, 'D4', 'audio');
    line('M752 448V470H1202');
    line('M1202 489H722V451');
    label(1060, 465, 'POI, ngôn ngữ', { anchor: 'middle', size: 13 });
    label(1060, 507, 'URL, thời lượng', { anchor: 'middle', size: 13 });
    line('M733 323V350');
    label(749, 341, 'ID POI chọn từ Khám phá', { size: 13 });
    line('M696 520L680 499V459L695 437');
    label(662, 492, 'ID POI từ Bản đồ/GPS', { anchor: 'end', size: 13 });
    dfdStore(1210, 605, 235, 38, 'D3', 'poi_localizations');
    line('M758 600V615H1202');
    line('M1202 632H734V606');
    label(1055, 610, 'ID POI, mã ngôn ngữ', { anchor: 'middle', size: 13 });
    label(1055, 650, 'Tên và mô tả đã dịch', { anchor: 'middle', size: 13 });
    // Repeated store symbols retain the same identifiers.
    [['D2', 'pois'], ['D3', 'poi_localizations'], ['D4', 'audio']].forEach(([id, title], index) => {
        const y = 657 + index * 49;
        dfdStore(1210, y, 235, 35, id, title);
        line(`M${edges[4](y + 8, 1)} ${y + 8}H1202`);
        line(`M1202 ${y + 25}H${edges[4](y + 25, 1)}`);
        label(1065, y + 5, 'Yêu cầu đọc / ghi ' + id, { anchor: 'middle', size: 12 });
        label(1065, y + 40, 'Dữ liệu / kết quả lưu ' + id, { anchor: 'middle', size: 12 });
    });
    box(30, 897, 220, 56, 'Quản trị viên', '', 'actor');
    line(`M250 909H543V865H${edges[5](865, -1)}`);
    line('M704 891V940H250');
    label(399, 901, 'JWT và yêu cầu thống kê', { anchor: 'middle', size: 14 });
    label(399, 960, 'Kết quả thống kê', { anchor: 'middle', size: 14 });
    label(36, 976, 'Tiến trình 2 hoặc 4 cung cấp ID POI cho tiến trình 3 khi khách chọn điểm hoặc GPS kích hoạt.', { size: 16 });
    label(36, 1004, 'Tiến trình 5 dùng lại D2, D3 và D4. Các thao tác ghi cần quyền quản trị.', { size: 16 });
    label(36, 1032, 'Tiến trình 3 lấy media qua URL. Nginx phục vụ tệp nội bộ và trình duyệt thực hiện TTS dự phòng.', { size: 16 });
    label(36, 1060, 'Tiến trình 6 nhận sự kiện từ giao diện khách và trả thống kê cho Admin. Kho D5 thuộc POI Service.', { size: 16 });
});

const data = {
    users: ['identity_db.users', 'id PK|email UQ|full_name|password (hash)|role'],
    pois: ['poi_db.pois', 'id PK|name|description|latitude|longitude|radius|qr_code UQ|image_url|status|category †|created_at|updated_at'],
    loc: ['localization_db.poi_localizations', 'id PK|poi_id L|language_code|localized_name|localized_description|created_at|updated_at|UQ (poi_id, language_code)'],
    audio: ['audio_db.audio', 'id PK|poi_id L|language_code|audio_url|duration_seconds|created_at|updated_at|UQ (poi_id, language_code)'],
    events: ['poi_db.analytics_events', 'id PK|event_type|visitor_id|session_id|poi_id L, NULL|page_path|source|created_at|device_id †, device_type †|device_name †, platform †|browser_name †'],
};

function table(x, y, w, [title, fields]) {
    const rows = fields.split('|');
    rect(x, y, w, 45 + rows.length * 25, '#f6fbff');
    rect(x, y, w, 42, '#eaf4fd');
    label(x + 14, y + 27, title, { size: 17, weight: 700 });
    rows.forEach((field, i) => label(x + 14, y + 63 + i * 25, field, { size: 15 }));
}

diagram('04-erd-logic', 'ERD nghiệp vụ', 'Bội số nghiệp vụ của POI và các nội dung liên quan', 1320, 680, () => {
    box(35, 126, 330, 76, 'Tài khoản', 'users • email, vai trò', 'store');
    box(35, 317, 330, 76, 'Địa điểm POI', 'pois • mã QR, tọa độ, bán kính', 'store');
    box(900, 144, 385, 76, 'Bản dịch', 'poi_localizations • POI + ngôn ngữ', 'store');
    box(900, 317, 385, 76, 'Audio', 'audio • POI + ngôn ngữ', 'store');
    box(900, 490, 385, 76, 'Sự kiện sử dụng', 'analytics_events • phiên, loại sự kiện', 'store');
    line('M365 334H560V182H900', { arrow: false, dashed: true });
    line('M365 354H900', { arrow: false, dashed: true });
    line('M365 375H560V528H900', { arrow: false, dashed: true });
    for (const [x, y, text] of [[378, 322, '1'], [842, 173, '0..N'], [378, 349, '1'], [842, 345, '0..N'], [378, 399, '0..1'], [842, 519, '0..N']]) label(x, y, text, { weight: 700 });
    label(619, 171, 'Có bản dịch', { size: 16 });
    label(614, 344, 'Có audio', { size: 16 });
    label(612, 516, 'Có thể được ghi nhận', { size: 16 });
    label(35, 620, 'Nét đứt biểu diễn tham chiếu nghiệp vụ theo poi_id. DDL bàn giao không khai báo FOREIGN KEY cho ba liên kết này.', { size: 16 });
    label(35, 648, 'Tài khoản có vai trò truy cập ở tầng ứng dụng. visitor_id và session_id là định danh theo dõi, không nối với users.', { size: 16 });
});

diagram('05-luoc-do-quan-he', 'Lược đồ quan hệ MySQL', 'Năm bảng nghiệp vụ • khóa chính, khóa duy nhất và cột tham chiếu', 1380, 935, () => {
    table(36, 112, 340, data.users);
    table(36, 344, 340, data.pois);
    table(530, 112, 355, data.loc);
    table(989, 112, 355, data.audio);
    table(989, 462, 355, data.events);
    line('M376 400H458V208H530', { dashed: true });
    line('M376 413H474V430H952V208H989', { dashed: true });
    line('M376 426H446V609H989', { dashed: true });
    label(483, 421, 'pois.id → audio.poi_id', { size: 15 });
    label(494, 598, 'pois.id → analytics_events.poi_id (có thể NULL)', { size: 15 });
    label(36, 845, 'PK: khóa chính  •  UQ: khóa duy nhất  •  L: tham chiếu logic  •  †: cột bổ sung qua migration/entity', { size: 16 });
    label(36, 875, 'Bảng kỹ thuật ngoài mô hình nghiệp vụ: pois_backup_20261013, schema_migrations và timestamp_normalization_audit.', { size: 16 });
    label(36, 905, 'Mũi tên nét đứt từ pois.id cho biết cột đối chiếu; các quan hệ này không được MySQL áp ràng buộc FK trong DDL bàn giao.', { size: 16 });
});

function boundary(x, y, w, h, title) {
    drawing.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#f9fbfd" stroke="${blue}" stroke-width="2" stroke-dasharray="7 5"/>`);
    label(x + 16, y + 27, title, { size: 16, weight: 700 });
}

diagram('06-c4-system-context', 'C4 mức 1 — Ngữ cảnh hệ thống', 'Người dùng và hệ thống bên ngoài', 1200, 520, () => {
    box(80, 130, 310, 78, 'Khách tham quan', 'Quét QR, xem bản đồ, nghe thuyết minh', 'actor');
    box(810, 130, 310, 78, 'Quản trị viên', 'Quản lý nội dung và xem thống kê', 'actor');
    box(350, 263, 500, 78, 'Hệ thống thuyết minh tự động đa ngôn ngữ', 'Cung cấp nội dung tại các điểm tham quan Hội An');
    line('M235 208V238H470V263');
    line('M965 208V238H730V263');
    box(350, 411, 500, 78, 'Dịch vụ bản đồ bên ngoài', 'Esri/OpenStreetMap cung cấp ô bản đồ • Google Maps chỉ đường');
    line('M600 341V411');
    label(615, 383, 'Trình duyệt tải bản đồ hoặc mở chỉ đường', { size: 14 });
});

diagram('07-c4-container', 'C4 mức 2 — Container', 'Bảy container triển khai và dịch vụ bản đồ bên ngoài', 1300, 730, () => {
    box(86, 109, 260, 55, 'Khách tham quan', '', 'actor');
    box(518, 109, 260, 55, 'Quản trị viên', '', 'actor');
    box(950, 109, 280, 55, 'Dịch vụ bản đồ bên ngoài', '', 'actor');
    boundary(30, 191, 1240, 511, 'Ranh giới hệ thống');
    box(465, 236, 370, 70, 'Frontend React + Nginx', 'SPA, /admin, ảnh và MP3 nội bộ');
    line('M216 164V222H540V236');
    line('M648 164V236');
    line('M835 252H1090V164');
    label(930, 242, 'Tải ô bản đồ / mở chỉ đường', { size: 14 });
    box(465, 355, 370, 65, 'API Gateway', 'Spring Boot • định tuyến theo URL');
    line('M650 306V355');
    label(666, 336, 'HTTP /api', { size: 14 });
    const services = [
        ['Identity Service', 'Đăng nhập và cấp JWT'],
        ['POI Service', 'POI và Analytics'],
        ['Localization Service', 'Bản dịch theo POI và ngôn ngữ'],
        ['Audio Service', 'URL và thời lượng audio'],
    ];
    services.forEach(([title, sub], i) => {
        const x = 62 + i * 300;
        const center = x + 135;
        line(`M${490 + i * 100} 420V${440 + i * 12}H${center}V503`);
        box(x, 503, 270, 72, title, sub);
        line(`M${center} 575V620`);
    });
    label(645, 439, 'HTTP REST', { anchor: 'middle', size: 13 });
    box(65, 620, 1170, 57, 'MySQL 8 • identity_db, poi_db, localization_db, audio_db', '', 'store');
    label(1135, 601, 'JDBC', { size: 14 });
});

diagram('08-c4-component', 'C4 mức 3 — Thành phần POI Service', 'Phóng to container POI Service và hai nhóm chức năng', 1250, 650, () => {
    box(435, 109, 380, 64, 'API Gateway', 'HTTP tới POI Service');
    boundary(42, 208, 1166, 339, 'POI Service • Spring Boot');
    for (const [x, chain] of [
        [88, [['API POI công khai và quản trị', 'PoiController · AdminPoiController'], ['Xử lý POI', 'PoiService · RelatedContentGuard'], ['Truy cập POI', 'PoiRepository']]],
        [685, [['API Analytics', 'AnalyticsController'], ['Ghi nhận và tổng hợp', 'AnalyticsService'], ['Truy cập sự kiện', 'AnalyticsEventRepository']]],
    ]) {
        chain.forEach(([title, sub], i) => box(x, 251 + i * 97, 475, 68, title, sub));
        line(`M${x + 237} 319V348`);
        line(`M${x + 237} 416V445`);
        line(`M${x + 237} 513V574`);
    }
    line('M475 173V195H325V251');
    line('M775 173V195H922V251');
    label(478, 194, 'REST • JWT cho API quản trị', { size: 14 });
    line('M685 382H628V479H563');
    label(620, 371, 'Tra POI', { size: 13 });
    box(238, 574, 774, 56, 'poi_db • pois và analytics_events', '', 'store');
});

diagram('09-c4-code', 'C4 mức 4 — Mã nguồn Analytics', 'Phóng to thành phần ghi nhận và tổng hợp trong POI Service', 1240, 530, () => {
    box(70, 125, 360, 89, 'AnalyticsController', 'recordEvent(request) · getSummary()');
    box(485, 125, 325, 89, 'AnalyticsService', 'record(request) · getSummary()');
    box(865, 125, 330, 89, 'AnalyticsEventRepository', 'Lưu và truy vấn sự kiện');
    line('M430 168H485');
    line('M810 168H865');
    box(70, 344, 360, 80, 'AnalyticsEventRequest', 'DTO nhận sự kiện từ frontend');
    box(485, 344, 325, 80, 'PoiRepository', 'Đọc dữ liệu POI khi cần');
    box(865, 344, 330, 80, 'AnalyticsEvent', 'Entity của bảng analytics_events', 'store');
    line('M250 214V344', { dashed: true });
    line('M648 214V344', { dashed: true });
    line('M1030 214V344', { dashed: true });
    label(262, 289, 'Nhận và kiểm tra DTO', { size: 14 });
    label(660, 289, 'Tra cứu POI', { size: 14 });
    label(1042, 289, 'Ánh xạ JPA', { size: 14 });
    label(36, 487, 'Các lớp thuộc poi-service/src/main/java/com/sgu/poi/analytics, riêng PoiRepository thuộc gói repository.', { size: 16 });
});

diagram('10-quy-trinh-admin-khach', 'Quy trình cập nhật và nghe thuyết minh', 'Kịch bản nghiệm thu xuyên suốt trang Admin và trang khách', 1230, 750, () => {
    const items = [
        ['Admin', '1. Đăng nhập và chọn POI', 'Identity trả JWT khi xác thực thành công.'],
        ['Admin', '2. Cập nhật bản dịch và URL audio', 'Lưu bản dịch và metadata audio theo cùng POI, cùng ngôn ngữ.'],
        ['Khách', '3. Quét QR hoặc chọn POI', 'Frontend lấy POI đang hoạt động và nội dung theo ngôn ngữ đã chọn.'],
        ['Khách', '4. Nghe thuyết minh và ghi nhận sự kiện', 'Phát MP3 khi truy cập được, hoặc dùng TTS khi có văn bản và trình duyệt hỗ trợ.'],
        ['Admin', '5. Đối chiếu số liệu trên Analytics', 'Mở thống kê và kiểm tra sự kiện trong cùng cửa sổ thời gian.'],
    ];
    items.forEach(([actor, title, detail], i) => {
        const y = 112 + 115 * i;
        box(55, y + 12, 180, 51, actor, '', 'actor');
        box(265, y, 900, 76, title, detail);
        if (i < items.length - 1) line(`M715 ${y + 76}V${y + 115}`);
    });
    label(55, 714, 'Nhánh lỗi cần thử: lưu thất bại, QR sai hoặc POI không hoạt động, audio không tải được, và token hết hạn.', { size: 16 });
});
