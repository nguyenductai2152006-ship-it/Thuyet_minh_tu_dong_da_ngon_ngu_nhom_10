import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getAllPois, getLocalization } from "../api/api";
import { getGoogleMapsDirectionsUrl } from "../utils/googleMaps";
import { normalizeSearch } from "../utils/search";
import "./InteractiveMap.css";
import GuideIcon from "./GuideIcon";

const HOI_AN_CENTER = [15.8773, 108.3290];
const ESRI_STREET_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
const ESRI_IMAGERY_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_REFERENCE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const ESRI_ATTRIBUTION = 'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener noreferrer">Esri</a> — Sources: Esri, HERE, Garmin, OpenStreetMap contributors, and the GIS user community';
const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';
const ESRI_DARK_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const ESRI_DARK_ATTRIBUTION = 'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener noreferrer">Esri</a> — Sources: Esri, HERE, Garmin, OpenStreetMap contributors, and the GIS user community';
const POI_REFRESH_MS = 60_000;

const MAP_PRO_COPY = {
    vi: { street: "Đường phố", satellite: "Vệ tinh", openStreetMap: "OpenStreetMap", dark: "Bản đồ tối", labels: "Nhãn địa danh", geofences: "Vùng kích hoạt GPS", refresh: "Làm mới", syncing: "Đang đồng bộ…", synced: "Địa điểm đã cập nhật", syncFailed: "Không đồng bộ được POI; đang giữ dữ liệu gần nhất.", neverSynced: "Đang lấy dữ liệu từ máy chủ…", basemapNote: "POI làm mới tự động mỗi phút. Bản đồ nền cập nhật theo nhà cung cấp, không phải ảnh/giao thông trực tiếp.", basemapStatus: "BẢN ĐỒ NỀN", active: "Đang dùng", noPois: "Chưa có địa điểm để hiển thị." },
    en: { street: "Street", satellite: "Satellite", openStreetMap: "OpenStreetMap", dark: "Dark map", labels: "Place labels", geofences: "GPS trigger radii", refresh: "Refresh POIs", syncing: "Syncing…", synced: "POIs synced", syncFailed: "Could not refresh POIs; keeping last available data.", neverSynced: "Loading places from server…", basemapNote: "POIs refresh every minute. Basemap content follows provider updates; it is not live imagery or live traffic.", basemapStatus: "BASEMAP", active: "Active", noPois: "No places to display." },
    zh: { street: "街道地图", satellite: "卫星影像", openStreetMap: "OpenStreetMap", dark: "深色地图", labels: "地名标签", geofences: "GPS 触发范围", refresh: "刷新景点", syncing: "同步中…", synced: "景点已同步", syncFailed: "无法刷新景点，保留最近数据。", neverSynced: "正在从服务器加载…", basemapNote: "景点每分钟刷新一次。底图按供应商计划更新，并非实时影像或实时交通。", basemapStatus: "底图", active: "使用中", noPois: "没有可显示的景点。" },
    ko: { street: "거리 지도", satellite: "위성", openStreetMap: "OpenStreetMap", dark: "다크 지도", labels: "장소 라벨", geofences: "GPS 반경", refresh: "장소 새로고침", syncing: "동기화 중…", synced: "장소 동기화 완료", syncFailed: "장소를 새로 고치지 못해 이전 데이터를 유지합니다.", neverSynced: "서버에서 장소를 불러오는 중…", basemapNote: "장소 데이터는 매분 새로고침됩니다. 지도 바탕은 공급자 업데이트 주기를 따르며 실시간 영상/교통이 아닙니다.", basemapStatus: "지도 바탕", active: "사용 중", noPois: "표시할 장소가 없습니다." },
    ja: { street: "道路地図", satellite: "衛星画像", openStreetMap: "OpenStreetMap", dark: "ダークマップ", labels: "地名ラベル", geofences: "GPS 起動範囲", refresh: "地点を更新", syncing: "同期中…", synced: "地点を同期しました", syncFailed: "地点を更新できないため、最新の取得済みデータを保持しています。", neverSynced: "サーバーから地点を取得中…", basemapNote: "地点は1分ごとに更新します。地図の背景は提供元の更新周期に従い、ライブ画像・交通情報ではありません。", basemapStatus: "ベースマップ", active: "使用中", noPois: "表示できる地点がありません。" },
};

function extractPoiArray(response) {
    let value = response;
    for (let depth = 0; depth < 5; depth += 1) {
        if (Array.isArray(value)) return value;
        if (!value || typeof value !== "object") return null;
        if (Array.isArray(value.content)) return value.content;
        if (Array.isArray(value.items)) return value.items;
        if (Array.isArray(value.pois)) return value.pois;
        value = value.data ?? value.results ?? null;
    }
    return null;
}

function poiDataSignature(items) {
    return (Array.isArray(items) ? items : [])
        .map((poi) => JSON.stringify([poi?.id, poi?.name, poi?.description, poi?.imageUrl, poi?.category, poi?.qrCode ?? poi?.qr_code, poi?.latitude, poi?.longitude, poi?.radius, poi?.status, poi?.updatedAt ?? poi?.updated_at]))
        .sort()
        .join("|");
}

function formatSyncTime(value, language) {
    if (!value) return "—";
    const locale = ({ vi: "vi-VN", en: "en-GB", zh: "zh-CN", ko: "ko-KR", ja: "ja-JP" })[language] || "vi-VN";
    try { return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(value); }
    catch { return value.toLocaleTimeString(); }
}

const MAP_COPY = {
    vi: { eyebrow: "HOIANGUIDE · KHÁM PHÁ", title: "Dạo bước phố Hội", intro: "Chọn một điểm dừng, lắng nghe câu chuyện và tìm đường khám phá phố cổ.", count: "địa điểm", gps: "Vị trí của bạn", selected: "ĐỊA ĐIỂM ĐANG CHỌN", radius: "Bán kính GPS", open: "Nghe thuyết minh", directions: "Chỉ đường", noCoords: "Chưa có địa điểm hoạt động với tọa độ hợp lệ.", qr: "Mã QR", footnote: "Vị trí POI được lấy từ dữ liệu backend. Vị trí GPS chỉ hiển thị khi người dùng đã cấp quyền.", street: "Đường phố", imagery: "Ảnh vệ tinh", labels: "Nhãn địa danh", all: "Toàn bộ điểm", locate: "Đến vị trí của tôi", search: "Bạn muốn ghé thăm đâu?", noResults: "Không tìm thấy địa điểm phù hợp.", loading: "Đang tải địa điểm…", mapError: "Không thể khởi tạo bản đồ.", tileError: "Bản đồ nền chưa tải đủ. Kiểm tra mạng hoặc đổi lớp bản đồ.", mapHint: "Chạm để khám phá từng điểm dừng", countLabel: "ĐIỂM THAM QUAN", coordLabel: "TỌA ĐỘ", distance: "Khoảng cách", zoom: "Tỷ lệ", noGps: "Chưa có vị trí GPS. Cho phép định vị trong trình duyệt để tính khoảng cách." },
    en: { eyebrow: "HOIANGUIDE · EXPLORE", title: "Detailed Hoi An Old Town Map", intro: "Explore places on a street map or satellite imagery. Select a marker for details, then choose “Listen to guide” to open narration.", count: "places", gps: "Your location", selected: "SELECTED PLACE", radius: "GPS radius", open: "Listen to guide", directions: "Directions", noCoords: "No active places with valid coordinates are available.", qr: "QR code", footnote: "POI coordinates come from the backend. GPS is shown only after permission is granted.", street: "Street map", imagery: "Satellite", labels: "Place labels", all: "All places", locate: "My location", search: "Search place or QR code…", noResults: "No matching places found.", loading: "Loading places…", mapError: "The map could not be initialized.", tileError: "Some basemap tiles did not load. Check connectivity or switch map layers.", mapHint: "Select a marker to view details", countLabel: "PLACES", coordLabel: "COORDINATES", distance: "Distance", zoom: "Scale", noGps: "GPS location is unavailable. Allow location in your browser to calculate distance." },
    zh: { eyebrow: "HOIANGUIDE · 探索", title: "会安古城详细地图", intro: "使用街道地图或卫星影像查看景点。选择标记查看信息，再点击“收听讲解”。", count: "个景点", gps: "您的位置", selected: "当前景点", radius: "GPS 半径", open: "收听讲解", directions: "路线导航", noCoords: "没有有效的景点坐标。", qr: "二维码", footnote: "景点坐标来自后端。只有在获得授权后才显示 GPS。", street: "街道地图", imagery: "卫星影像", labels: "地名标签", all: "全部景点", locate: "我的位置", search: "搜索景点或二维码…", noResults: "没有符合条件的景点。", loading: "正在加载景点…", mapError: "无法初始化地图。", tileError: "部分地图瓦片未加载，请检查网络或切换图层。", mapHint: "选择标记查看详情", countLabel: "景点", coordLabel: "坐标", distance: "距离", zoom: "比例尺", noGps: "GPS 不可用。请在浏览器中允许定位以计算距离。" },
    ko: { eyebrow: "HOIANGUIDE · 탐색", title: "호이안 구시가지 상세 지도", intro: "거리 지도 또는 위성 사진에서 장소를 확인하세요. 마커를 선택해 정보를 보고 안내 듣기를 누르세요.", count: "개 장소", gps: "현재 위치", selected: "선택한 장소", radius: "GPS 반경", open: "안내 듣기", directions: "길찾기", noCoords: "유효한 좌표가 있는 장소가 없습니다.", qr: "QR 코드", footnote: "장소 좌표는 백엔드 데이터에서 가져옵니다. GPS는 권한을 허용한 경우에만 표시됩니다.", street: "거리 지도", imagery: "위성 이미지", labels: "장소 라벨", all: "모든 장소", locate: "내 위치", search: "장소 또는 QR 검색…", noResults: "검색 결과가 없습니다.", loading: "장소를 불러오는 중…", mapError: "지도를 초기화할 수 없습니다.", tileError: "일부 지도 타일을 불러오지 못했습니다. 네트워크 또는 지도를 확인하세요.", mapHint: "마커를 선택해 세부 정보를 확인하세요", countLabel: "장소", coordLabel: "좌표", distance: "거리", zoom: "축척", noGps: "GPS를 사용할 수 없습니다. 브라우저에서 위치 권한을 허용하세요." },
    ja: { eyebrow: "HOIANGUIDE · 探索", title: "ホイアン旧市街 詳細マップ", intro: "道路地図または衛星画像で観光地を確認できます。マーカーを選んで情報を表示し、音声ガイドを開きます。", count: "か所", gps: "現在地", selected: "選択中の場所", radius: "GPS 半径", open: "音声ガイドを聞く", directions: "経路案内", noCoords: "有効な座標を持つ場所がありません。", qr: "QR コード", footnote: "場所の座標はバックエンドから取得します。GPS は許可された場合のみ表示されます。", street: "道路地図", imagery: "衛星画像", labels: "地名ラベル", all: "すべての場所", locate: "現在地", search: "場所または QR を検索…", noResults: "該当する場所がありません。", loading: "場所を読み込み中…", mapError: "地図を初期化できませんでした。", tileError: "地図タイルを読み込めません。接続または地図レイヤーを確認してください。", mapHint: "マーカーを選択して詳細を表示", countLabel: "観光地", coordLabel: "座標", distance: "距離", zoom: "縮尺", noGps: "GPS を利用できません。ブラウザーで位置情報を許可してください。" },
};

function validCoordinates(poi) {
    if (poi?.latitude === null || poi?.latitude === undefined || poi?.latitude === "" || poi?.longitude === null || poi?.longitude === undefined || poi?.longitude === "") return false;
    const latitude = Number(poi.latitude);
    const longitude = Number(poi.longitude);
    return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

function distanceMeters(from, to) {
    if (!from || !validCoordinates(to)) return null;
    const latitude = Number(from.latitude);
    const longitude = Number(from.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    const rad = (value) => value * Math.PI / 180;
    const deltaLat = rad(Number(to.latitude) - latitude);
    const deltaLng = rad(Number(to.longitude) - longitude);
    const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(rad(latitude)) * Math.cos(rad(Number(to.latitude))) * Math.sin(deltaLng / 2) ** 2;
    const safeA = Math.min(1, Math.max(0, a));
    return Math.round(6371000 * 2 * Math.atan2(Math.sqrt(safeA), Math.sqrt(1 - safeA)));
}

function makePoiIcon(number, selected) {
    const node = document.createElement("span");
    node.className = `hag-map-marker${selected ? " is-selected" : ""}`;
    node.setAttribute("aria-hidden", "true");
    const numberNode = document.createElement("span");
    numberNode.className = "hag-map-marker__number";
    numberNode.textContent = String(number);
    node.appendChild(numberNode);
    return L.divIcon({ className: "hag-map-div-icon", html: node, iconSize: [34, 42], iconAnchor: [17, 34], popupAnchor: [0, -31] });
}

function makeGpsIcon() {
    const node = document.createElement("span");
    node.className = "hag-map-gps-marker";
    node.setAttribute("aria-label", "GPS location");
    return L.divIcon({ className: "hag-map-gps-icon", html: node, iconSize: [24, 24], iconAnchor: [12, 12] });
}

function createPopup(poi, name, description, openLabel, onListen) {
    const root = document.createElement("div");
    root.className = "hag-map-popup";
    const title = document.createElement("strong");
    title.className = "hag-map-popup__title";
    title.textContent = name || `POI ${poi.id}`;
    root.appendChild(title);
    if (description) {
        const text = document.createElement("p");
        text.textContent = description;
        root.appendChild(text);
    }
    const coordinates = document.createElement("small");
    coordinates.textContent = `${Number(poi.latitude).toFixed(6)}, ${Number(poi.longitude).toFixed(6)}`;
    root.appendChild(coordinates);
    const action = document.createElement("button");
    action.type = "button";
    action.className = "hag-map-popup__button";
    action.textContent = openLabel;
    action.addEventListener("click", () => onListen?.(poi));
    root.appendChild(action);
    return root;
}

export default function InteractiveMap({ pois = [], language = "vi", gpsPosition, onOpenPoi }) {
    const t = MAP_COPY[language] || MAP_COPY.vi;
    const pro = MAP_PRO_COPY[language] || MAP_PRO_COPY.vi;
    const mapElementRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerLayerRef = useRef(null);
    const gpsMarkerRef = useRef(null);
    const gpsAccuracyCircleRef = useRef(null);
    const geofenceLayerRef = useRef(null);
    const baseLayersRef = useRef(null);
    const labelLayerRef = useRef(null);
    const activeBaseLayerRef = useRef(null);
    const boundsSignatureRef = useRef("");
    const [mapPois, setMapPois] = useState(() => Array.isArray(pois) ? pois : []);
    const [mapError, setMapError] = useState("");
    const [tileError, setTileError] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [search, setSearch] = useState("");
    const [localizedNames, setLocalizedNames] = useState({});
    const [localizedDescriptions, setLocalizedDescriptions] = useState({});
    const [baseLayer, setBaseLayer] = useState("street");
    const [showLabels, setShowLabels] = useState(true);
    const [showGeofences, setShowGeofences] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [syncError, setSyncError] = useState("");
    const [lastSyncAt, setLastSyncAt] = useState(null);

    useEffect(() => {
        if (!Array.isArray(pois)) return;
        setMapPois((current) => poiDataSignature(current) === poiDataSignature(pois) ? current : pois);
    }, [pois]);

    const refreshPois = useCallback(async () => {
        setRefreshing(true);
        try {
            const response = await getAllPois();
            const fetchedPois = extractPoiArray(response);
            if (!fetchedPois) throw new Error("API /api/pois không trả về danh sách POI hợp lệ.");
            setMapPois((current) => poiDataSignature(current) === poiDataSignature(fetchedPois) ? current : fetchedPois);
            setLastSyncAt(new Date());
            setSyncError("");
        } catch (error) {
            console.error("HoiAnGuide map POI refresh failed:", error);
            setSyncError(error?.response?.data?.message || error?.message || pro.syncFailed);
        } finally {
            setRefreshing(false);
        }
    }, [pro.syncFailed]);

    useEffect(() => {
        void refreshPois();
        const intervalId = window.setInterval(() => {
            if (document.visibilityState === "visible") void refreshPois();
        }, POI_REFRESH_MS);
        return () => window.clearInterval(intervalId);
    }, [refreshPois]);

    const activePois = useMemo(() => (Array.isArray(mapPois) ? mapPois : []).filter((poi) => String(poi?.status || "").toUpperCase() === "ACTIVE" && validCoordinates(poi)), [mapPois]);
    const filteredPois = useMemo(() => {
        const query = normalizeSearch(search);
        if (!query) return activePois;
        return activePois.filter((poi) => [poi.name, poi.qrCode, poi.description, poi.id, localizedNames[poi.id]].some((value) => normalizeSearch(value).includes(query)));
    }, [activePois, localizedNames, search]);
    const selectedPoi = filteredPois.find((poi) => Number(poi.id) === Number(selectedId)) || filteredPois[0] || null;

    useEffect(() => {
        let map;
        let resizeObserver;
        let disposed = false;
        try {
            if (!mapElementRef.current) return undefined;
            map = L.map(mapElementRef.current, { zoomControl: false, scrollWheelZoom: true, preferCanvas: true, zoomSnap: 0.5 }).setView(HOI_AN_CENTER, 16);
            const streetLayer = L.tileLayer(ESRI_STREET_URL, { minZoom: 3, maxZoom: 19, attribution: ESRI_ATTRIBUTION, crossOrigin: true });
            const imageryLayer = L.tileLayer(ESRI_IMAGERY_URL, { minZoom: 3, maxZoom: 19, attribution: ESRI_ATTRIBUTION, crossOrigin: true });
            const osmLayer = L.tileLayer(OSM_TILE_URL, { minZoom: 3, maxZoom: 19, attribution: OSM_ATTRIBUTION, subdomains: "abc", crossOrigin: true });
            const darkLayer = L.tileLayer(ESRI_DARK_URL, { minZoom: 3, maxZoom: 19, attribution: ESRI_DARK_ATTRIBUTION, crossOrigin: true });
            const labelsLayer = L.tileLayer(ESRI_REFERENCE_URL, { minZoom: 3, maxZoom: 19, attribution: ESRI_ATTRIBUTION, crossOrigin: true, pane: "overlayPane" });
            [streetLayer, imageryLayer, osmLayer, darkLayer, labelsLayer].forEach((layer) => {
                layer.on("tileerror", () => { if (!disposed) setTileError(true); });
                layer.on("tileload", () => { if (!disposed) setTileError(false); });
            });
            streetLayer.addTo(map);
            L.control.zoom({ position: "topright" }).addTo(map);
            L.control.scale({ position: "bottomleft", metric: true, imperial: false, maxWidth: 120 }).addTo(map);
            mapInstanceRef.current = map;
            baseLayersRef.current = { street: streetLayer, satellite: imageryLayer, osm: osmLayer, dark: darkLayer };
            activeBaseLayerRef.current = streetLayer;
            labelLayerRef.current = labelsLayer;
            geofenceLayerRef.current = L.layerGroup();
            markerLayerRef.current = L.layerGroup().addTo(map);
            resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => map.invalidateSize({ pan: false })) : null;
            resizeObserver?.observe(mapElementRef.current);
            window.setTimeout(() => { if (!disposed && map) map.invalidateSize({ pan: false }); }, 100);
        } catch (initializationError) {
            console.error("HoiAnGuide Leaflet initialization failed:", initializationError);
            if (!disposed) setMapError(initializationError?.message || t.mapError);
        }
        return () => {
            disposed = true;
            resizeObserver?.disconnect();
            map?.remove();
            mapInstanceRef.current = null;
            markerLayerRef.current = null;
            gpsMarkerRef.current = null;
            gpsAccuracyCircleRef.current = null;
            geofenceLayerRef.current = null;
            baseLayersRef.current = null;
            labelLayerRef.current = null;
            activeBaseLayerRef.current = null;
        };
        // Map and controls are created once; language strings in layer labels refresh on reload.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const map = mapInstanceRef.current;
        const layers = baseLayersRef.current;
        if (!map || !layers) return;
        Object.values(layers).forEach((layer) => { if (map.hasLayer(layer)) map.removeLayer(layer); });
        const nextLayer = layers[baseLayer] || layers.street;
        nextLayer.addTo(map);
        activeBaseLayerRef.current = nextLayer;
        const labelsLayer = labelLayerRef.current;
        if (labelsLayer) {
            if (baseLayer === "satellite" && showLabels) labelsLayer.addTo(map);
            else if (map.hasLayer(labelsLayer)) map.removeLayer(labelsLayer);
        }
        // Redraw the selected provider's tiles when the basemap is switched.
        nextLayer.redraw?.();
    }, [baseLayer, showLabels]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        const group = geofenceLayerRef.current;
        if (!map || !group) return;
        group.clearLayers();
        if (!showGeofences) {
            if (map.hasLayer(group)) map.removeLayer(group);
            return;
        }
        activePois.forEach((poi) => {
            const radius = Number(poi.radius);
            if (!Number.isFinite(radius) || radius <= 0) return;
            const circle = L.circle([Number(poi.latitude), Number(poi.longitude)], {
                radius,
                color: Number(poi.id) === Number(selectedPoi?.id) ? "#d97736" : "#2b8097",
                weight: Number(poi.id) === Number(selectedPoi?.id) ? 2 : 1,
                dashArray: "5 5",
                fillColor: Number(poi.id) === Number(selectedPoi?.id) ? "#f7a45a" : "#55b3c1",
                fillOpacity: 0.09,
                interactive: false,
            });
            circle.addTo(group);
        });
        group.addTo(map);
    }, [activePois, selectedPoi?.id, showGeofences]);

    useEffect(() => {
        let cancelled = false;
        async function loadLocalizedText() {
            const responses = await Promise.allSettled(activePois.map(async (poi) => ({ poiId: poi.id, response: await getLocalization(poi.id, language) })));
            if (cancelled) return;
            const nameMap = {};
            const descriptionMap = {};
            for (const result of responses) {
                if (result.status !== "fulfilled") continue;
                const { poiId, response } = result.value;
                const poi = activePois.find((item) => Number(item.id) === Number(poiId));
                const row = response?.data ?? response;
                nameMap[poiId] = (row?.localizedName || poi?.name || `POI ${poiId}`).normalize("NFC");
                descriptionMap[poiId] = row?.localizedDescription || poi?.description || "";
            }
            setLocalizedNames(nameMap);
            setLocalizedDescriptions(descriptionMap);
        }
        void loadLocalizedText();
        return () => { cancelled = true; };
    }, [activePois, language]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        const markerLayer = markerLayerRef.current;
        if (!map || !markerLayer) return;
        markerLayer.clearLayers();
        const bounds = L.latLngBounds([]);
        filteredPois.forEach((poi) => {
            const name = localizedNames[poi.id] || poi.name || `POI ${poi.id}`;
            const marker = L.marker([Number(poi.latitude), Number(poi.longitude)], {
                icon: makePoiIcon(activePois.findIndex((item) => Number(item.id) === Number(poi.id)) + 1, false),
                poiId: poi.id,
                title: name,
                alt: name,
                riseOnHover: true,
                keyboard: true,
            });
            marker.bindTooltip(name, { direction: "top", sticky: true, opacity: 0.96, className: "hag-map-tooltip" });
            marker.bindPopup(() => createPopup(poi, name, localizedDescriptions[poi.id] || poi.description || "", t.open, onOpenPoi), { maxWidth: 260, minWidth: 180, closeButton: true });
            marker.on("click", () => setSelectedId(poi.id));
            marker.addTo(markerLayer);
            bounds.extend([Number(poi.latitude), Number(poi.longitude)]);
        });
        const signature = filteredPois.map((poi) => `${poi.id}:${poi.latitude}:${poi.longitude}`).sort().join("|");
        if (bounds.isValid() && signature && signature !== boundsSignatureRef.current) {
            if (filteredPois.length === 1) map.setView(bounds.getCenter(), 17);
            else map.fitBounds(bounds.pad(0.16), { maxZoom: 17, animate: false });
            boundsSignatureRef.current = signature;
        }
    }, [activePois, filteredPois, localizedNames, localizedDescriptions, onOpenPoi, t.open]);

    // Update selection without recreating markers, so clicking a pin keeps its popup open.
    useEffect(() => {
        markerLayerRef.current?.eachLayer((marker) => {
            const index = activePois.findIndex((poi) => Number(poi.id) === Number(marker.options.poiId));
            const selected = Number(marker.options.poiId) === Number(selectedPoi?.id);
            marker.setIcon(makePoiIcon(index + 1, selected));
            marker.setZIndexOffset(selected ? 1000 : 0);
        });
    }, [activePois, filteredPois, localizedNames, localizedDescriptions, onOpenPoi, selectedPoi?.id, t.open]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        if (!gpsPosition || !Number.isFinite(Number(gpsPosition.latitude)) || !Number.isFinite(Number(gpsPosition.longitude))) {
            gpsMarkerRef.current?.remove();
            gpsMarkerRef.current = null;
            gpsAccuracyCircleRef.current?.remove();
            gpsAccuracyCircleRef.current = null;
            return;
        }
        const position = [Number(gpsPosition.latitude), Number(gpsPosition.longitude)];
        if (gpsMarkerRef.current) gpsMarkerRef.current.setLatLng(position);
        else gpsMarkerRef.current = L.marker(position, { icon: makeGpsIcon(), title: t.gps, keyboard: false, zIndexOffset: 1200 }).addTo(map);
        const accuracy = Number(gpsPosition.accuracy);
        if (Number.isFinite(accuracy) && accuracy > 0 && accuracy < 10000) {
            if (gpsAccuracyCircleRef.current) {
                gpsAccuracyCircleRef.current.setLatLng(position);
                gpsAccuracyCircleRef.current.setRadius(accuracy);
            } else {
                gpsAccuracyCircleRef.current = L.circle(position, { radius: accuracy, color: "#2877f0", weight: 1, fillColor: "#2877f0", fillOpacity: 0.07, interactive: false }).addTo(map);
                gpsAccuracyCircleRef.current.bringToBack();
            }
        } else {
            gpsAccuracyCircleRef.current?.remove();
            gpsAccuracyCircleRef.current = null;
        }
    }, [gpsPosition, t.gps]);

    const selectPoi = useCallback((poi) => {
        setSelectedId(poi.id);
        const map = mapInstanceRef.current;
        if (map) map.flyTo([Number(poi.latitude), Number(poi.longitude)], Math.max(map.getZoom(), 17), { duration: 0.45 });
    }, []);

    const showAllPois = useCallback(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        if (!activePois.length) {
            map.setView(HOI_AN_CENTER, 16);
            return;
        }
        const bounds = L.latLngBounds(activePois.map((poi) => [Number(poi.latitude), Number(poi.longitude)]));
        if (bounds.isValid()) map.fitBounds(bounds.pad(0.16), { maxZoom: 17 });
        else map.setView(HOI_AN_CENTER, 16);
    }, [activePois]);

    const locateMe = useCallback(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        if (gpsPosition && Number.isFinite(Number(gpsPosition.latitude)) && Number.isFinite(Number(gpsPosition.longitude))) {
            map.flyTo([Number(gpsPosition.latitude), Number(gpsPosition.longitude)], 18, { duration: 0.45 });
        }
    }, [gpsPosition]);

    return (
        <section className="feature-panel map-panel hag-map-panel">
            <div className="feature-heading hag-map-heading"><div><p className="feature-eyebrow">{t.eyebrow}</p><h2>{t.title}</h2><p>{t.intro}</p></div><span className="feature-count">{activePois.length} {t.count}</span></div>
            <div className="hag-map-toolbar">
                <label className="hag-map-search"><GuideIcon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} aria-label={t.search} />{search && <button type="button" onClick={() => setSearch("")} aria-label={t.all}>×</button>}</label>
                <button type="button" className="hag-map-tool" onClick={() => { setSearch(""); showAllPois(); }}>◎ {t.all}</button>
                <button type="button" className="hag-map-tool" onClick={locateMe} disabled={!gpsPosition}>⊙ {t.locate}</button>
            </div>

            <div className="hag-map-workspace">
                <div className="hag-map-stage">
            <div className="map-frame-wrap leaflet-map-frame hag-map-frame">
                <div ref={mapElementRef} className="leaflet-map-canvas" aria-label={t.title} />
                {mapError && <div className="map-load-error" role="alert"><strong>{t.mapError}</strong><p>{mapError}</p></div>}
                {!mapError && tileError && <div className="map-tile-warning" role="status">{t.tileError}</div>}
                <div className="hag-map-legend"><span><i className="hag-map-legend__poi" />{t.countLabel}</span><span><i className="hag-map-legend__gps" />GPS</span></div>
                <div className="map-source-note">Esri · OpenStreetMap</div>
            </div>


            <div className="hag-map-layerbar" aria-label={pro.basemapStatus}>
                <div className="hag-map-layerbar__choices" role="group" aria-label={pro.basemapStatus}>
                    {[
                        ["street", "▤", pro.street],
                        ["satellite", "▧", pro.satellite],
                        ["osm", "⌖", pro.openStreetMap],
                        ["dark", "◐", pro.dark],
                    ].map(([key, icon, label]) => <button type="button" key={key} className={`hag-map-layer-choice${baseLayer === key ? " is-active" : ""}`} aria-pressed={baseLayer === key} onClick={() => setBaseLayer(key)}><span aria-hidden="true">{icon}</span>{label}</button>)}
                </div>
                <div className="hag-map-layerbar__toggles">
                    <button type="button" className={`hag-map-toggle${showLabels ? " is-active" : ""}`} aria-pressed={showLabels} disabled={baseLayer !== "satellite"} onClick={() => setShowLabels((value) => !value)}>▦ {pro.labels}</button>
                    <button type="button" className={`hag-map-toggle${showGeofences ? " is-active" : ""}`} aria-pressed={showGeofences} onClick={() => setShowGeofences((value) => !value)}>◌ {pro.geofences}</button>
                </div>
            </div>


            <div className="hag-map-syncbar" aria-live="polite">
                <div className="hag-map-syncbar__state">
                    <span className={`hag-map-sync-dot${syncError ? " is-warning" : lastSyncAt ? " is-ok" : ""}`} />
                    <span>{syncError ? pro.syncFailed : lastSyncAt ? `${pro.synced} · ${formatSyncTime(lastSyncAt, language)}` : pro.neverSynced}</span>
                    <span className="hag-map-syncbar__cadence">⟳ 60s</span>
                </div>
                <button type="button" className="hag-map-refresh" onClick={() => void refreshPois()} disabled={refreshing}>
                    <span className={refreshing ? "hag-map-refresh__icon is-spinning" : "hag-map-refresh__icon"}>↻</span>
                    {refreshing ? pro.syncing : pro.refresh}
                </button>
            </div>
            {syncError && <div className="hag-map-sync-error" role="status">{pro.syncFailed} <span>{syncError}</span></div>}

                    {!gpsPosition && <p className="hag-map-no-gps">{t.noGps}</p>}
                </div>
                <aside className="hag-map-sidebar" aria-label={t.selected}>
            {selectedPoi && <div className="selected-map-poi hag-selected-map-poi">
                <div className="hag-selected-map-poi__main">{selectedPoi.imageUrl && <img className="hag-selected-photo" src={selectedPoi.imageUrl} alt="" />}<p className="selected-map-label">{t.selected}</p><h3>{localizedNames[selectedPoi.id] || selectedPoi.name}</h3><p>{localizedDescriptions[selectedPoi.id] || selectedPoi.description || ""}</p><details className="hag-selected-details"><summary>{t.coordLabel} · GPS · QR</summary><div className="hag-selected-meta"><span><strong>{t.coordLabel}</strong>{Number(selectedPoi.latitude).toFixed(7)}, {Number(selectedPoi.longitude).toFixed(7)}</span>{selectedPoi.radius != null && <span><strong>{t.radius}</strong>{Number(selectedPoi.radius)} m</span>}<span><strong>{t.qr}</strong>{selectedPoi.qrCode || `POI-${selectedPoi.id}`}</span>{distanceMeters(gpsPosition, selectedPoi) !== null && <span><strong>{t.distance}</strong>{distanceMeters(gpsPosition, selectedPoi)} m</span>}</div></details></div>
                <div className="map-selected-actions"><button type="button" className="primary-action" onClick={() => onOpenPoi?.(selectedPoi)}>{t.open}</button><a href={getGoogleMapsDirectionsUrl(selectedPoi, gpsPosition)} target="_blank" rel="noopener noreferrer" className="secondary-action">{t.directions}</a></div>
            </div>}


            <div className="hag-map-list-heading"><div><h3>{t.countLabel}</h3><p>{t.mapHint}</p></div><span>{filteredPois.length} / {activePois.length}</span></div>
            <div className="poi-map-list hag-poi-map-list">
                {filteredPois.map((poi) => {
                    const selected = Number(poi.id) === Number(selectedPoi?.id);
                    const distance = distanceMeters(gpsPosition, poi);
                    return <button type="button" key={poi.id} className={`poi-map-row hag-poi-map-row${selected ? " selected" : ""}`} onClick={() => selectPoi(poi)} aria-pressed={selected}>
                        <span className="poi-map-number">{activePois.findIndex((item) => Number(item.id) === Number(poi.id)) + 1}</span>
                        <span className="poi-map-row-copy"><strong>{localizedNames[poi.id] || poi.name || `POI ${poi.id}`}</strong><small>{Number(poi.latitude).toFixed(4)}° N · {Number(poi.longitude).toFixed(4)}° E</small></span>
                        {distance !== null && <span className="poi-map-distance">{distance} m</span>}
                    </button>;
                })}
                {!filteredPois.length && <div className="hag-map-no-results">{activePois.length ? t.noResults : t.noCoords}</div>}
            </div>

                </aside>
            </div>
            <p className="feature-footnote hag-map-freshness-note">{pro.basemapNote}</p>
        </section>
    );
}
