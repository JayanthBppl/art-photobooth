import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";

function FinalPage() {
  const { layout, processedImage, user } = useContext(AppContext);
  const navigate = useNavigate();

  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [emailTriggered, setEmailTriggered] = useState(false); // ✅ Prevent duplicates

  const BASE_URL = "https://art-photobooth-1.onrender.com";

  useEffect(() => {
    if (!layout || !processedImage) {
      console.warn("⚠️ Missing layout or processed image → redirecting home");
      navigate("/");
      return;
    }

    if (emailTriggered) return; // ✅ Skip if already triggered

    const captureAndSendEmail = async () => {
      try {
        setEmailTriggered(true); // ✅ Lock to prevent duplicate calls
        setSending(true);

        const captureArea = document.getElementById("final-composition");
        if (!captureArea) return;

        // ✅ Generate merged image
        const canvas = await html2canvas(captureArea, {
          useCORS: true,
          backgroundColor: null,
        });
        const mergedImage = canvas.toDataURL("image/png");

        // ✅ Upload merged image to backend (Cloudinary)
        const uploadRes = await fetch(`${BASE_URL}/upload-final`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: mergedImage }),
        });

        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          console.error("❌ Upload failed:", uploadData.message);
          setEmailTriggered(false); // allow retry on failure
          return;
        }

        const finalImageUrl = uploadData.url; // Cloudinary URL ✅

        // ✅ Send Email with Cloudinary URL (NOT base64)
        const emailRes = await fetch(`${BASE_URL}/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user?.email,
            imageUrl: finalImageUrl,
            sender: "hello@map-india.org",
          }),
        });

        const emailData = await emailRes.json();
        if (emailData.success) {
          console.log("✅ Email sent to", user?.email);
          setEmailSent(true);
        } else {
          console.error("❌ Email failed:", emailData.message);
          setEmailTriggered(false); // allow retry if failed
        }

        // ✅ Generate QR code for final image
        const qrRes = await fetch(`${BASE_URL}/generate-qr`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: finalImageUrl }),
        });

        const qrData = await qrRes.json();
        if (qrData.success) {
          setQrCode(qrData.qrCode);
        }
      } catch (err) {
        console.error("❌ Error in finalization flow:", err);
        setEmailTriggered(false); // reset so retry is possible
      } finally {
        setSending(false);
      }
    };

    captureAndSendEmail();
  }, [layout, processedImage, user, navigate, emailTriggered]);

  if (!layout || !processedImage) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <h3>Loading final composition...</h3>
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 py-4" style={{ minHeight: "100vh" }}>
      <div className="row justify-content-center align-items-center h-100">
        {/* Left: Final Composition */}
        <div className="col-lg-6 d-flex flex-column align-items-center mb-4 mb-lg-0">
          <div
            id="final-composition"
            style={{
              position: "relative",
              display: "inline-block",
              width: "100%",
              maxWidth: "700px",
            }}
          >
            {/* Layout Template */}
            <img
              src={layout.src}
              alt={layout.id}
              className="img-fluid"
              style={{
                width: "100%",
                height: "auto",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.4)",
                borderRadius: "8px",
              }}
            />

            {/* User Image */}
            <img
              src={processedImage}
              alt="User"
              className="img-fluid"
              style={{
                position: "absolute",
                top: "65%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                height: "70%",
                width: "auto",
                maxHeight: "270px",
              }}
            />
          </div>

          {/* Actions */}
          <div className="mt-4 d-flex flex-column flex-sm-row align-items-center gap-2">
            {sending && <p>Sending your final image to email...</p>}
            {emailSent && <p className="text-success">✅ Email sent successfully!</p>}

            <button className="btn btn-danger" onClick={() => navigate("/")}>
              Home
            </button>
          </div>
        </div>

        {/* Right: QR Code */}
        <div className="col-lg-4 d-flex flex-column align-items-center mt-5 pt-5">
          {qrCode && (
            <div className="text-center">
              <img src={qrCode} alt="QR Code" style={{ width: "250px" }} />
              <h6> Scan and download the image</h6>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FinalPage;
