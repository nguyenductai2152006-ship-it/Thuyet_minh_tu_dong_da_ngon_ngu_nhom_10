import { useEffect, useMemo, useState } from "react";
import { getLocalization } from "../api/api";
import { normalizeSearch as normalizeText } from "../utils/search";
import "./ExploreLanding.css";
import GuideIcon from "./GuideIcon";

const COPY = {
    vi: {
        eyebrow: "DI SẢN · VĂN HÓA · TRẢI NGHIỆM",
        title: "Chạm vào nét xưa Hội An",
        intro: "Khám phá những mái nhà vàng, hội quán cổ và câu chuyện văn hóa của phố Hội qua thuyết minh đa ngôn ngữ.",
        search: "Tìm địa điểm bạn muốn khám phá...",
        nearby: "Tìm quanh tôi",
        map: "Mở bản đồ",
        featured: "Điểm đến nổi bật",
        hint: "Chọn một địa điểm để xem thông tin và nghe thuyết minh.",
        all: "Tất cả", places: "điểm dừng",
        history: "Di tích",
        oldhouse: "Nhà cổ",
        assembly: "Hội quán",
        market: "Chợ & đời sống",
        showAll: "Xem tất cả",
        showLess: "Thu gọn",
        details: "Khám phá",
        noResults: "Chưa tìm thấy địa điểm phù hợp. Thử một từ khóa khác nhé.",
        category: "Địa điểm di sản",
        loading: "Đang tải các địa điểm Hội An…",
    },
    en: {
        eyebrow: "HERITAGE · CULTURE · EXPERIENCE",
        title: "Discover the old soul of Hoi An",
        intro: "Explore golden old houses, historic assembly halls, and the stories behind this riverside heritage town in five languages.",
        search: "Search places to explore...",
        nearby: "Find nearby",
        map: "Open map",
        featured: "Featured places",
        hint: "Choose a place to read its story and open the audio guide.",
        all: "All places", places: "places",
        history: "Heritage",
        oldhouse: "Old houses",
        assembly: "Assembly halls",
        market: "Market & life",
        showAll: "View all",
        showLess: "Show less",
        details: "Explore",
        noResults: "No places found. Try another keyword.",
        category: "Heritage place",
        loading: "Loading Hoi An places…",
    },
    zh: {
        eyebrow: "遗产 · 文化 · 体验",
        title: "探索会安古城韵味",
        intro: "用五种语言探索黄色古宅、历史会馆，以及河畔古城背后的文化故事。",
        search: "搜索想探索的地点…",
        nearby: "查找附近",
        map: "打开地图",
        featured: "精选景点",
        hint: "选择一个地点，查看介绍并打开语音讲解。",
        all: "全部地点", places: "个景点",
        history: "历史遗迹",
        oldhouse: "古宅",
        assembly: "会馆",
        market: "市场与生活",
        showAll: "查看全部",
        showLess: "收起",
        details: "探索",
        noResults: "没有找到合适的地点，请尝试其他关键词。",
        category: "文化遗产",
        loading: "正在加载会安景点…",
    },
    ko: {
        eyebrow: "유산 · 문화 · 체험",
        title: "호이안의 오래된 매력을 만나보세요",
        intro: "다섯 가지 언어로 노란 옛집과 역사적인 회관, 강변 고도의 문화 이야기를 탐험해 보세요.",
        search: "둘러볼 장소 검색...",
        nearby: "주변 찾기",
        map: "지도 열기",
        featured: "추천 명소",
        hint: "장소를 선택해 소개와 오디오 가이드를 확인하세요.",
        all: "전체 장소", places: "개 장소",
        history: "역사 유적",
        oldhouse: "고택",
        assembly: "회관",
        market: "시장과 생활",
        showAll: "모두 보기",
        showLess: "접기",
        details: "둘러보기",
        noResults: "장소를 찾을 수 없습니다. 다른 검색어를 사용해 보세요.",
        category: "문화유산",
        loading: "호이안 명소를 불러오는 중…",
    },
    ja: {
        eyebrow: "遺産 · 文化 · 体験",
        title: "ホイアンの古い街並みを巡る",
        intro: "5つの言語で、黄色い古民家や歴史ある会館、川沿いの街に息づく文化の物語を発見しましょう。",
        search: "探索したい場所を検索...",
        nearby: "近くを探す",
        map: "地図を開く",
        featured: "おすすめスポット",
        hint: "場所を選んで詳細と音声ガイドを確認してください。",
        all: "すべて", places: "か所",
        history: "史跡",
        oldhouse: "古民家",
        assembly: "会館",
        market: "市場と暮らし",
        showAll: "すべて表示",
        showLess: "折りたたむ",
        details: "探索する",
        noResults: "該当する場所がありません。別のキーワードをお試しください。",
        category: "文化遺産",
        loading: "ホイアンのスポットを読み込んでいます…",
    },
};

const POI_IMAGES = {
    3: "/Images/Chua-cau-Hoi-An.jpg",
    4: "/Images/Nha-co-Tan-Ky.jpg",
    5: "/Images/Hoi-quan-Phuc-Kien.jpg",
    6: "/Images/Cho-Hoi-An.jpg",
    7: "/Images/Hoi-quan-Quang-Dong.jpg",
    8: "/Images/Nha-co-Phung-Hung.jpg",
    9: "/Images/Hoi-quan-Trieu-Chau.jpg",
};

function categoryForPoi(poi){return ["history","oldhouse","assembly","market","heritage"].includes(poi.category)?poi.category:"heritage";}

export default function ExploreLanding({ pois = [], language = "vi", onOpenPoi, onFindNearest, onShowMap }) {
    const t = COPY[language] || COPY.vi;
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("all");
    const [showAll, setShowAll] = useState(false);
    const [localized, setLocalized] = useState({});

    const activePois = useMemo(
        () => pois.filter((poi) => poi.status === "ACTIVE"),
        [pois]
    );

    useEffect(() => {
        let cancelled = false;
        async function loadTranslations() {
            const entries = await Promise.all(activePois.map(async (poi) => {
                try {
                    const result = await getLocalization(poi.id, language);
                    return [poi.id, result];
                } catch {
                    return [poi.id, null];
                }
            }));
            if (!cancelled) {
                setLocalized(Object.fromEntries(entries.map(([id, row]) => [id, {
                    name: row?.localizedName || activePois.find((poi) => Number(poi.id) === Number(id))?.name || "",
                    description: row?.localizedDescription || activePois.find((poi) => Number(poi.id) === Number(id))?.description || "",
                }])));
            }
        }
        if (activePois.length) loadTranslations();
        return () => { cancelled = true; };
    }, [activePois, language]);

    const filteredPois = useMemo(() => {
        const term = normalizeText(query.trim());
        return activePois.filter((poi) => {
            const copy = localized[poi.id] || {};
            const matchesCategory = category === "all" || categoryForPoi(poi) === category;
            const haystack = normalizeText(`${copy.name || poi.name} ${copy.description || poi.description} ${poi.qrCode || ""}`);
            return matchesCategory && (!term || haystack.includes(term));
        });
    }, [activePois, category, localized, query]);

    const isFiltering = Boolean(query.trim()) || category !== "all";
    const shownPois = showAll || isFiltering ? filteredPois : filteredPois.slice(0, 4);
    const categories = [
        ["all", t.all], ["history", t.history], ["oldhouse", t.oldhouse],
        ["assembly", t.assembly], ["market", t.market], ["heritage", t.category],
    ];

    return (
        <section className="explore-landing" aria-label={t.featured}>
            <section className="explore-hero">
                <div className="explore-hero-copy">
                    <p className="explore-eyebrow">{t.eyebrow}</p>
                    <h1>{t.title}</h1>
                    <p className="explore-intro">{t.intro}</p>
                    <label className="explore-search">
                        <GuideIcon name="search" />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => { setQuery(event.target.value); setShowAll(true); }}
                            placeholder={t.search}
                            aria-label={t.search}
                        />
                        {query && <button type="button" className="explore-clear" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
                    </label>
                    <div className="explore-hero-actions">
                        <button type="button" className="explore-action-primary" onClick={onFindNearest}><GuideIcon name="pin" />{t.nearby}</button>
                        <button type="button" className="explore-action-secondary" onClick={onShowMap}><GuideIcon name="map" />{t.map}</button>
                    </div>
                    <div className="explore-hero-facts"><span><strong>{activePois.length.toString().padStart(2, "0")}</strong>{t.places}</span><span><GuideIcon name="headphones" />VI · EN · 中文 · 한국어 · 日本語</span></div>
                </div>
                <div className="explore-hero-visual" aria-hidden="true"><img src="/Images/Chua-cau-Hoi-An.jpg" alt="" fetchPriority="high" /><div className="explore-photo-caption"><span>HỘI AN, VIỆT NAM</span><strong>15°52′ N · 108°19′ E</strong></div><span className="explore-photo-stamp">Hội An<br /><small>PHỐ CỔ</small></span></div>
            </section>

            <section className="explore-featured-section">
                <div className="explore-section-heading">
                    <div>
                        <p className="explore-eyebrow explore-eyebrow-small">HOIANGUIDE · {t.details.toUpperCase()}</p>
                        <h2>{t.featured}</h2>
                        <p>{t.hint}</p>
                    </div>
                    {!isFiltering && filteredPois.length > 4 && (
                        <button type="button" className="explore-view-all" onClick={() => setShowAll((value) => !value)}>
                            {showAll ? t.showLess : t.showAll} <span aria-hidden="true">→</span>
                        </button>
                    )}
                </div>

                <div className="explore-category-list" aria-label={t.all}>
                    {categories.map(([key, label]) => (
                        <button key={key} type="button" aria-pressed={category === key} className={category === key ? "selected" : ""} onClick={() => { setCategory(key); setShowAll(key !== "all"); }}>
                            {label}
                        </button>
                    ))}
                </div>

                {shownPois.length ? (
                    <div className="explore-poi-grid">
                        {shownPois.map((poi, index) => {
                            const copy = localized[poi.id] || {};
                            const name = (copy.name || poi.name || `POI ${poi.id}`).normalize("NFC");
                            const description = copy.description || poi.description || "";
                            return (
                                <button key={poi.id} type="button" className="explore-poi-card" onClick={() => onOpenPoi?.(poi)} aria-label={`${t.details}: ${name}`}>
                                    <span className="explore-poi-photo">
                                        <img src={poi.imageUrl || POI_IMAGES[Number(poi.id)] || "/Images/Cho-Hoi-An.jpg"} alt={name} loading={index < 4 ? "eager" : "lazy"} />
                                        <span className="explore-poi-number">{String(index + 1).padStart(2, "0")}</span>
                                    </span>
                                    <span className="explore-poi-content">
                                        <span className="explore-poi-category">{t[categoryForPoi(poi)] || t.category}</span>
                                        <strong>{name}</strong>
                                        {description && <span className="explore-poi-description">{description}</span>}
                                        <span className="explore-poi-link">{t.details} <span aria-hidden="true">↗</span></span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <p className="explore-no-results">{activePois.length ? t.noResults : t.loading}</p>
                )}
            </section>
        </section>
    );
}
