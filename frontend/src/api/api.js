import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8080",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export async function login(email, password) {
    const response = await api.post("/api/v1/auth/login", {
        email,
        password,
    });

    localStorage.setItem("accessToken", response.data.accessToken);
    localStorage.setItem("userRole", response.data.role);
    localStorage.setItem("userEmail", response.data.email);

    return response.data;
}

export async function getPoiByQrCode(qrCode) {
    const response = await api.get(
        `/api/pois/qr/${encodeURIComponent(qrCode)}`
    );

    return response.data;
}

export async function getLocalization(poiId, languageCode) {
    const response = await api.get("/api/localizations", {
        params: {
            poiId,
            lang: languageCode,
        },
    });

    return response.data;
}

export async function getAudio(poiId, languageCode) {
    const response = await api.get("/api/audio", {
        params: {
            poiId,
            lang: languageCode,
        },
    });

    return response.data;
}

export function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
}

export default api;