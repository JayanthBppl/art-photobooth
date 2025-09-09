import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";

function FinalPage() {
  const { layout, processedImage, user } = useContext(AppContext);
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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

        const canvas = await html2canvas(captureArea, {
          useCORS: true,
          backgroundColor: null,
        });

        const imageData = canvas.toDataURL("image/png");

        const response = await fetch(`${BASE_URL}/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user?.email, image: imageData }),
        });

        const data = await response.json();
        if (data.success) {
          console.log("✅ Email sent to", user?.email);
          setEmailSent(true);
        } else {
          console.error("❌ Email failed:", data.message);
        }
      } catch (err) {
        console.error("❌ Error sending email:", err);
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

  const handleDownload = async () => {
    const captureArea = document.getElementById("final-composition");
    if (!captureArea) return;

    const canvas = await html2canvas(captureArea, {
      useCORS: true,
      backgroundColor: null,
    });

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `photobooth_${user._id}.png`;
    link.click();
  };

  return (
    <div
      className="container-fluid d-flex flex-column justify-content-center align-items-center px-3 py-4"
      style={{ minHeight: "100vh" }}
    >
      {/* Final Composition */}
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
            height: "70%", // relative to layout
            width: "auto",
            maxHeight: "270px",
          }}
        />
      </div>

      {/* Actions */}
      <div className="mt-4 d-flex flex-column flex-sm-row align-items-center gap-2">
        {sending && <p>Sending your final image to email...</p>}
        {emailSent && <p className="text-success">✅ Email sent successfully!</p>}

        <button className="btn btn-success" onClick={handleDownload}>
          Download Final Image
        </button>

        <button className="btn btn-danger" onClick={() => navigate("/")}>
          Restart
        </button>
      </div>
    </div>
  );
}

export default FinalPage;
