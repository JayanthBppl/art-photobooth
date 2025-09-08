import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";

function FinalPage() {
  const { layout, processedImage, user } = useContext(AppContext);
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [savedImageUrl, setSavedImageUrl] = useState(null);
   const BASE_URL = "https://art-photobooth-1.onrender.com";


  useEffect(() => {
    if (!layout || !processedImage) {
      console.warn("⚠️ Missing layout or processed image → redirecting home");
      navigate("/");
      return;
    }

    const saveAndEmail = async () => {
      try {
        const captureArea = document.getElementById("final-composition");
        if (!captureArea) return;

        setSaving(true);

        // Render the final composition to canvas
        const canvas = await html2canvas(captureArea, {
          useCORS: true,
          backgroundColor: null,
        });

        const imageData = canvas.toDataURL("image/png");

        // 1️⃣ Save to server
        const saveRes = await fetch(`${BASE_URL}/save-final-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: imageData, userId: user._id }),
        });
        const saveData = await saveRes.json();

        if (saveData.success) {
          setSavedImageUrl(saveData.filePath);
          console.log("✅ Final image saved at:", saveData.filePath);

          // 2️⃣ Send email with saved image
          await fetch(`${BASE_URL}/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user?.email,
              imageUrl: saveData.filePath, // send URL instead of base64
            }),
          });

          console.log("✅ Email sent to", user?.email);
        }
      } catch (err) {
        console.error("❌ Error saving/finalizing image:", err);
      } finally {
        setSaving(false);
      }
    };

    saveAndEmail();
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
      className="container-fluid d-flex flex-column justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      {/* Final Composition */}
      <div
        id="final-composition"
        style={{
          position: "relative",
          display: "inline-block",
        }}
      >
        {/* Layout Template */}
        <img
          src={layout.src}
          alt={layout.id}
          style={{
            width: "700px",
            height: "400px",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.4)",
          }}
        />

        {/* User Image */}
        <img
          src={processedImage}
          alt="User"
          style={{
            position: "absolute",
            top: "65%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            height: "270px",
            width: "auto",
          }}
        />
      </div>

      {/* Actions */}
      <div className="mt-4 d-flex flex-column align-items-center">
        {saving && <p>Saving final image...</p>}

        {/* Download Button */}
        {savedImageUrl && (
          <a
            className="btn btn-success mx-2"
            href={`${BASE_URL}${savedImageUrl}`}
            download={`photobooth_${user._id}.png`}
          >
            Download Final Image
          </a>
        )}

        {/* Restart Button */}
        <button className="btn btn-danger mx-2 mt-2" onClick={() => navigate("/")}>
          Restart
        </button>
      </div>
    </div>
  );
}

export default FinalPage;
