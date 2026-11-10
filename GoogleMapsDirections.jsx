import { openGoogleMapsDirections } from "../utils/googleMaps";

export default function GoogleMapsDirections({ poi, originPosition = null }) {
    return (
        <button
            type="button"
            onClick={() => openGoogleMapsDirections(poi, originPosition)}
            style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                backgroundColor: "#ffffff",
                color: "#1f2937",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
            }}
        >
            📍 Chỉ đường bằng Google Maps
        </button>
    );
}
