import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

function QrScanner({ onScanSuccess }) {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            {
                fps: 10,
                qrbox: {
                    width: 250,
                    height: 250,
                },
            },
            false
        );

        let handled = false;

        scanner.render(
            (decodedText) => {
                if (handled) {
                    return;
                }

                handled = true;
                onScanSuccess(decodedText);
            },
            (errorMessage) => {
                console.debug("QR scan:", errorMessage);
            }
        );

        return () => {
            scanner
                .clear()
                .catch((error) => {
                    console.error(
                        "Không thể đóng QR scanner:",
                        error
                    );
                });
        };
    }, [onScanSuccess]);

    return (
        <div>
            <h2>Quét mã QR</h2>
            <p>
                Đưa mã QR của địa điểm vào khung camera.
            </p>
            <div id="qr-reader" />
        </div>
    );
}

export default QrScanner;