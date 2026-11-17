import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

function QrScanner({ onScanSuccess }) {
    const [error,setError]=useState("");
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

        let handled=false,pending=false,disposed=false,lastCode=null,lastAttempt=0;

        scanner.render(
            async (decodedText) => {
                if (disposed || handled || pending || (lastCode===decodedText && Date.now()-lastAttempt<2000)) {
                    return;
                }

                pending=true;lastCode=decodedText;lastAttempt=Date.now();
                try {const accepted=await onScanSuccess(decodedText);if(!disposed){handled=accepted===true;setError(handled?"":"Mã chưa hợp lệ hoặc chưa tải được POI. Hãy quét lại.");}}
                catch {if(!disposed)setError("Chưa tải được địa điểm. Hãy quét lại.");}
                finally {pending=false;}
            },
            (errorMessage) => {
                console.debug("QR scan:", errorMessage);
            }
        );

        return () => {
            disposed=true;
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
            {error && <p role="alert">{error}</p>}
            <div id="qr-reader" />
        </div>
    );
}

export default QrScanner;