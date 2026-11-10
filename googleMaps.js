function hasValidCoordinates(latitude, longitude) {
    if (
        latitude === null ||
        latitude === undefined ||
        longitude === null ||
        longitude === undefined ||
        latitude === "" ||
        longitude === ""
    ) {
        return false;
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    return (
        Number.isFinite(lat) &&
        Number.isFinite(lon) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
    );
}

/**
 * Return the display name used in HoiAnGuide.
 * Names come from managed content.
 */
export function getPoiDisplayName(poi, languageCode = "vi", localizedName = null) {
    return localizedName || poi?.name || "Địa điểm Hội An";
}

/**
 * Build a Google Maps directions URL using managed destination coordinates, or the
 * name when coordinates are unavailable. Current GPS coordinates, when present,
 * are used only as the route origin.
 */
export function getGoogleMapsDirectionsUrl(poi, originPosition = null) {
    const destination=hasValidCoordinates(poi?.latitude,poi?.longitude)?`${Number(poi.latitude)},${Number(poi.longitude)}`:(poi?.name?`${String(poi.name).trim()}, Hoi An, Vietnam`:"Hoi An, Vietnam");
    const params = new URLSearchParams({
        api: "1",
        destination,
        travelmode: "walking",
    });

    if (
        originPosition &&
        hasValidCoordinates(originPosition.latitude, originPosition.longitude)
    ) {
        params.set(
            "origin",
            `${Number(originPosition.latitude)},${Number(originPosition.longitude)}`
        );
    }

    return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function openGoogleMapsDirections(poi, originPosition = null) {
    const url = getGoogleMapsDirectionsUrl(poi, originPosition);
    window.open(url, "_blank", "noopener,noreferrer");
}
