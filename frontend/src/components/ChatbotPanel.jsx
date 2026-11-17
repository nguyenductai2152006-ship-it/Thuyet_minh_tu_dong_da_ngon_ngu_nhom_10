import { useEffect, useMemo, useState } from "react";
import { getLocalization } from "../api/api";
import "./ChatbotPanel.css";

const COPY = {
    vi: {
        eyebrow: "HOIANGUIDE · TRỢ LÝ THAM QUAN", status: "Đã kết nối dữ liệu", user: "Bạn", footnote: "MVP đang tra cứu dữ liệu POI đã lưu, chưa kết nối mô hình AI tạo sinh bên ngoài. Giờ mở cửa/giá vé chỉ được trả lời nếu có dữ liệu đã xác minh.", title: "Bạn muốn tìm hiểu điều gì?",
        intro: "Trợ lý tra cứu mô tả địa điểm từ dữ liệu HoiAnGuide hiện có. Những thông tin chưa có trong cơ sở dữ liệu sẽ được báo rõ, không tự đoán.",
        placeholder: "Ví dụ: Kể cho tôi về Chùa Cầu…", send: "Gửi", thinking: "Đang tra cứu dữ liệu…",
        welcome: "Xin chào! Tôi có thể giới thiệu các địa điểm trong HoiAnGuide, tìm mô tả theo ngôn ngữ bạn chọn và mở thuyết minh của từng nơi.",
        list: "Hệ thống hiện có các địa điểm:", unknown: "Mình chưa tìm thấy thông tin phù hợp trong dữ liệu hiện có. Bạn thử hỏi tên một địa điểm trong danh sách, hoặc hỏi về mô tả, vị trí và mã QR nhé.",
        hours: "Dữ liệu hiện tại chưa lưu giờ mở cửa, giá vé hoặc tình trạng vé. Mình không muốn đưa ra thông tin chưa được xác minh; bạn nên kiểm tra nguồn chính thức tại điểm tham quan.",
        location: "Vị trí lưu trong hệ thống:", distance: "Tọa độ", open: "Mở thuyết minh", map: "Mở bản đồ", sources: "Nguồn: dữ liệu POI và bản dịch trong HoiAnGuide.",
        prompt1: "Giới thiệu các địa điểm", prompt2: "Địa điểm này ở đâu?", prompt3: "Giờ mở cửa và giá vé"
    },
    en: {
        eyebrow: "HOIANGUIDE · VISITOR ASSISTANT", status: "Data connected", user: "You", footnote: "This MVP retrieves saved POI data; it is not connected to an external generative AI model. Opening hours/ticket prices are only answered when verified data exists.", title: "What would you like to explore?",
        intro: "This assistant retrieves verified descriptions from the current HoiAnGuide data. It will say when information is not available instead of guessing.",
        placeholder: "E.g. Tell me about the Japanese Covered Bridge…", send: "Send", thinking: "Searching the guide data…",
        welcome: "Hello! I can introduce the places currently in HoiAnGuide, retrieve descriptions in your selected language, and open a place guide.",
        list: "Places currently available:", unknown: "I couldn't find a matching answer in the available data. Try a POI name or ask about its description, location, or QR code.",
        hours: "Opening hours, ticket prices, and ticket availability are not stored in the current database. I won't guess; please check an official source at the attraction.",
        location: "Location stored in the system:", distance: "Coordinates", open: "Open audio guide", map: "Open map", sources: "Source: HoiAnGuide POI and localization data.",
        prompt1: "List the places", prompt2: "Where is it?", prompt3: "Opening hours and tickets"
    },
    zh: {
        eyebrow: "HOIANGUIDE · 游览助手", status: "已连接数据", user: "您", footnote: "当前 MVP 检索已保存的景点数据，尚未连接外部生成式 AI。只有存在已核实数据时才回答开放时间或门票价格。", title: "您想了解什么？",
        intro: "此助手从现有 HoiAnGuide 景点数据中检索介绍。数据库没有的信息会明确说明，不会猜测。",
        placeholder: "例如：介绍一下日本廊桥……", send: "发送", thinking: "正在查询景点数据……",
        welcome: "您好！我可以介绍 HoiAnGuide 中的景点、查询所选语言的说明，并打开景点讲解。",
        list: "当前景点列表：", unknown: "现有数据中没有找到匹配答案。请尝试景点名称，或询问介绍、位置和二维码。",
        hours: "当前数据库没有营业时间、门票价格或票务状态。我不会猜测，请向景点官方渠道核实。",
        location: "系统保存的位置：", distance: "坐标", open: "打开讲解", map: "打开地图", sources: "来源：HoiAnGuide 景点和语言数据。",
        prompt1: "列出景点", prompt2: "景点在哪里？", prompt3: "开放时间和门票"
    },
    ko: {
        eyebrow: "HOIANGUIDE · 여행 도우미", status: "데이터 연결됨", user: "나", footnote: "현재 MVP는 저장된 관광지 데이터를 검색하며 외부 생성형 AI 모델에는 연결되지 않았습니다. 운영 시간과 입장료는 검증된 데이터가 있을 때만 답변합니다.", title: "무엇을 알아볼까요?",
        intro: "이 도우미는 현재 HoiAnGuide 장소 데이터에서 설명을 검색합니다. 데이터에 없는 내용은 추측하지 않고 알려드립니다.",
        placeholder: "예: 일본 내원교에 대해 알려 주세요…", send: "전송", thinking: "장소 데이터를 검색 중…",
        welcome: "안녕하세요! HoiAnGuide에 등록된 장소를 소개하고, 선택한 언어의 설명을 찾거나 오디오 가이드를 열 수 있습니다.",
        list: "현재 등록된 장소:", unknown: "현재 데이터에서 답을 찾지 못했습니다. 장소 이름이나 설명, 위치, QR 코드에 대해 물어보세요.",
        hours: "현재 데이터베이스에는 운영 시간, 입장료 또는 티켓 정보가 없습니다. 추측하지 않으며 공식 정보를 확인하시기 바랍니다.",
        location: "시스템에 저장된 위치:", distance: "좌표", open: "오디오 가이드 열기", map: "지도 열기", sources: "출처: HoiAnGuide 장소 및 다국어 데이터.",
        prompt1: "장소 목록", prompt2: "어디에 있나요?", prompt3: "운영 시간과 입장료"
    },
    ja: {
        eyebrow: "HOIANGUIDE · 観光アシスタント", status: "データ接続済み", user: "あなた", footnote: "このMVPは保存済みの観光地データを検索し、外部の生成AIモデルには接続していません。営業時間や料金は確認済みデータがある場合のみ回答します。", title: "何について知りたいですか？",
        intro: "このアシスタントは、現在のHoiAnGuideの観光地データから説明を検索します。データにない情報は推測せずにお伝えします。",
        placeholder: "例：来遠橋について教えて…", send: "送信", thinking: "観光地データを検索中…",
        welcome: "こんにちは。HoiAnGuideに登録された観光地の紹介、選択言語の説明の検索、音声ガイドの表示ができます。",
        list: "現在登録されている観光地：", unknown: "現在のデータから回答を見つけられませんでした。観光地名、説明、場所、QRコードについて質問してください。",
        hours: "現在のデータベースには営業時間、入場料、チケット情報がありません。推測せず、公式情報の確認をおすすめします。",
        location: "システムに保存された位置：", distance: "座標", open: "音声ガイドを開く", map: "地図を開く", sources: "出典：HoiAnGuideの観光地・多言語データ。",
        prompt1: "観光地一覧", prompt2: "場所はどこですか？", prompt3: "営業時間と料金"
    },
};

const ALIASES = {
    3: ["japanese covered bridge", "lai vien kieu", "cau chua", "chua cau", "来遠橋", "日本橋"],
    4: ["tan ky", "tan ky ancient house", "nhà cổ tấn ký", "nhacotanky"],
    5: ["fujian", "fujian assembly hall", "phuc kien", "phước kiến", "福建會館", "福建会馆"],
    6: ["hoi an market", "cho hoi an", "chợ hội an"],
    7: ["cantonese assembly hall", "quang dong", "廣東會館", "广东会馆"],
    8: ["phung hung", "phung hung ancient house", "phùng hưng"],
    9: ["chaozhou assembly hall", "trieu chau", "triều châu", "潮州會館", "潮州会馆"],
};

function normalize(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/gi, (char) => char === "Đ" ? "D" : "d")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function findPoi(query, activePois, names) {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return null;
    let candidates = [];
    for (const poi of activePois) {
        const nameList = [poi.name, names[poi.id], poi.qrCode, ...(ALIASES[poi.id] || [])]
            .filter(Boolean).map(normalize);
        for (const name of nameList) {
            if (name.length >= 3 && normalizedQuery.includes(name)) {
                candidates.push({ poi, score: name.length });
            }
        }
    }
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0]?.poi || null;
}

function ChatbotContent({ pois = [], language = "vi", currentPoi = null, onOpenPoi, onShowMap }) {
    const text = COPY[language] || COPY.vi;
    const [messages, setMessages] = useState(() => [{ id: "welcome", role: "assistant", text: text.welcome }]);
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const [localized, setLocalized] = useState({});
    const activePois = useMemo(() => pois.filter((poi) => poi.status === "ACTIVE"), [pois]);

    useEffect(() => {
        let cancelled = false;
        async function loadNames() {
            const entries = await Promise.all(activePois.map(async (poi) => {
                try {
                    const row = await getLocalization(poi.id, language);
                    return [poi.id, row];
                } catch {
                    return [poi.id, null];
                }
            }));
            if (!cancelled) setLocalized(Object.fromEntries(entries));
        }
        if (activePois.length) loadNames();
        return () => { cancelled = true; };
    }, [activePois, language]);

    const names = useMemo(() => Object.fromEntries(activePois.map((poi) => [
        poi.id, localized[poi.id]?.localizedName || poi.name
    ])), [activePois, localized]);

    async function answerQuestion(query) {
        const q = normalize(query);
        const hoursIntent = /(gio mo cua|opening hours|open hours|ticket|gia ve|ve vao cong|entrance fee|营业时间|门票|운영 시간|입장료|営業時間|入場料)/.test(q);
        if (hoursIntent) return { text: text.hours, poi: null };

        const listIntent = /(cac dia diem|danh sach|dia diem nao|list the places|list places|which places|all places|所有景点|有哪些景点|장소 목록|관광지 목록|観光地一覧|どんな場所)/.test(q);
        if (listIntent) {
            const rows = activePois.map((poi) => names[poi.id] || poi.name).filter(Boolean);
            return { text: `${text.list}\n${rows.map((name, index) => `${index + 1}. ${name}`).join("\n")}`, poi: null };
        }

        const matched = findPoi(query, activePois, names) || (currentPoi && /(nay|this place|here|这个地方|이 장소|この場所)/.test(q) ? currentPoi : null);
        if (!matched) return { text: text.unknown, poi: null };

        const isLocation = /(o dau|vi tri|toa do|where|location|coordinate|direction|directions|在哪里|位置|坐标|어디|위치|좌표|どこ|場所|座標)/.test(q);
        if (isLocation) {
            return {
                text: `${text.location} ${names[matched.id] || matched.name}.\n${text.distance}: ${Number(matched.latitude).toFixed(7)}, ${Number(matched.longitude).toFixed(7)}.\n${text.sources}`,
                poi: matched,
            };
        }

        let localization = localized[matched.id];
        if (!localization) {
            try { localization = await getLocalization(matched.id, language); } catch { localization = null; }
        }
        const description = localization?.localizedDescription || matched.description;
        if (!description) return { text: text.unknown, poi: matched };
        return {
            text: `${names[matched.id] || matched.name}\n${description}\n\n${text.sources}`,
            poi: matched,
        };
    }

    async function submit(queryOverride) {
        const query = String(queryOverride ?? input).trim();
        if (!query || busy) return;
        setMessages((items) => [...items, { id: `${Date.now()}-user`, role: "user", text: query }]);
        setInput("");
        setBusy(true);
        try {
            const result = await answerQuestion(query);
            setMessages((items) => [...items, {
                id: `${Date.now()}-assistant`, role: "assistant", text: result.text,
                poi: result.poi ? { id: result.poi.id, name: names[result.poi.id] || result.poi.name, qrCode: result.poi.qrCode } : null,
            }]);
        } catch {
            setMessages((items) => [...items, { id: `${Date.now()}-assistant`, role: "assistant", text: text.unknown }]);
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="feature-panel chatbot-panel">
            <div className="feature-heading">
                <div>
                    <p className="feature-eyebrow">{text.eyebrow}</p>
                    <h2>{text.title}</h2>
                    <p>{text.intro}</p>
                </div>
                <span className="chatbot-status"><i /> {text.status}</span>
            </div>

            <div className="chat-suggestions" aria-label="Suggested questions">
                {[text.prompt1, text.prompt2, text.prompt3].map((prompt) => (
                    <button type="button" key={prompt} disabled={busy} onClick={() => submit(prompt)}>{prompt}</button>
                ))}
            </div>

            <div className="chat-messages" aria-live="polite">
                {messages.map((message) => (
                    <article key={message.id} className={`chat-message ${message.role}`}>
                        <div className="chat-avatar">{message.role === "assistant" ? "H" : text.user}</div>
                        <div className="chat-bubble">
                            <p>{message.text}</p>
                            {message.poi && (
                                <div className="chat-actions">
                                    <button type="button" className="primary-action" onClick={() => {
                                        const poi = activePois.find((item) => Number(item.id) === Number(message.poi.id));
                                        if (poi) onOpenPoi?.(poi);
                                    }}>{text.open}</button>
                                    <button type="button" className="secondary-action" onClick={onShowMap}>{text.map}</button>
                                </div>
                            )}
                        </div>
                    </article>
                ))}
                {busy && <div className="chat-busy">● {text.thinking}</div>}
            </div>

            <form className="chat-compose" onSubmit={(event) => { event.preventDefault(); submit(); }}>
                <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={text.placeholder} maxLength={500} aria-label="Your question" />
                <button type="submit" disabled={busy || !input.trim()}>{busy ? "…" : text.send}</button>
            </form>
            <p className="feature-footnote">{text.footnote}</p>
        </section>
    );
}

export default function ChatbotPanel(props) {
    return <ChatbotContent key={props.language || "vi"} {...props} />;
}
