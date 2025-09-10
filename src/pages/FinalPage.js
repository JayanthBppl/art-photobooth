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

  const BASE_URL = "https://art-photobooth-1.onrender.com";

  useEffect(() => {
    if (!layout || !processedImage) {
      console.warn("⚠️ Missing layout or processed image → redirecting home");
      navigate("/");
      return;
    }

    const captureAndSendEmail = async () => {
      try {
        const captureArea = document.getElementById("final-composition");
        if (!captureArea) return;

        setSending(true);

        // Generate merged image
        const canvas = await html2canvas(captureArea, {
          useCORS: true,
          backgroundColor: null,
        });

        const mergedImage = canvas.toDataURL("image/png");

        // 1️⃣ Upload merged image to backend (Cloudinary)
        const uploadRes = await fetch(`${BASE_URL}/upload-final`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: mergedImage }),
        });

        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          console.error("❌ Upload failed:", uploadData.message);
          return;
        }

        const finalImageUrl = uploadData.url; // Cloudinary URL

        // 2️⃣ Send Email with final image
        const emailRes = await fetch(`${BASE_URL}/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user?.email,
            mergedImage,
          }),
        });

        const emailData = await emailRes.json();
        if (emailData.success) {
          console.log("✅ Email sent to", user?.email);
          setEmailSent(true);
        } else {
          console.error("❌ Email failed:", emailData.message);
        }

        // 3️⃣ Generate QR code for final image
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
      } finally {
        setSending(false);
      }
    };

    captureAndSendEmail();
  }, [layout, processedImage, user, navigate]);

  if (!layout || !processedImage) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <h3>Loading final composition...</h3>
      </div>
    );
  }

  return (
   <div
  className="container-fluid px-3 py-4"
  style={{ minHeight: "100vh" }}
>
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
    <div className="col-lg-4 d-flex flex-column align-items-center">
      {qrCode && (
        <div className="text-center">
          <h6> Scan to Download</h6>
          <img src={qrCode} alt="QR Code" style={{ width: "250px" }} />
        </div>
      )}
    </div>
  </div>
</div>


  );
}

export default FinalPage;
