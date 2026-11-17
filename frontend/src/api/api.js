import axios from "axios";

const api = axios.create({
    baseURL: "",
    timeout: 15000,
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

api.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401 && error.config?.url !== "/api/v1/auth/login") {
        logout();
        window.dispatchEvent(new Event("hoianguide:unauthorized"));
    }
    return Promise.reject(error);
});

export async function getCurrentUser() {
    const response = await api.get("/api/v1/auth/me");
    return response.data;
}

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


// POI collection and administration APIs.
export async function getAllPois() {
    const response = await api.get("/api/pois");
    return response.data;
}

export async function createPoi(payload) {
    const response = await api.post("/api/pois", payload);
    return response.data;
}

export async function updatePoi(id, payload) {
    const response = await api.put(`/api/pois/${id}`, payload);
    return response.data;
}

export async function deletePoi(id) {
    const response = await api.delete(`/api/pois/${id}`);
    return response.data;
}

export async function getLocalizationsForPoi(poiId) {
    const response = await api.get("/api/localizations", { params: { poiId } });
    return response.data;
}

export async function createLocalization(payload) {
    const response = await api.post("/api/localizations", payload);
    return response.data;
}

export async function updateLocalization(id, payload) {
    const response = await api.put(`/api/localizations/${id}`, payload);
    return response.data;
}

export async function deleteLocalization(id) {
    const response = await api.delete(`/api/localizations/${id}`);
    return response.data;
}

export async function getAudiosForPoi(poiId) {
    const response = await api.get("/api/audio", { params: { poiId } });
    return response.data;
}

export async function createAudio(payload) {
    const response = await api.post("/api/audio", payload);
    return response.data;
}

export async function updateAudio(id, payload) {
    const response = await api.put(`/api/audio/${id}`, payload);
    return response.data;
}

export async function deleteAudio(id) {
    const response = await api.delete(`/api/audio/${id}`);
    return response.data;
}

export async function getAdminPois() {
    const response = await api.get("/api/admin/pois");
    return response.data;
}
