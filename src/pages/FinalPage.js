import React, { useContext, useEffect, useState, useRef } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

function FinalPage() {
  const { layout, processedImage, user } = useContext(AppContext);
  const navigate = useNavigate();

  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  // const [qrCode, setQrCode] = useState(null);
  const [finalImageUrl, setFinalImageUrl] = useState(null); // 🔑 Cloudinary-composed image

  const hasRunRef = useRef(false);

  const BASE_URL = "https://art-photobooth-1.onrender.com";
  // const BASE_URL = "http://localhost:5000";

  useEffect(() => {
    if (!layout || !processedImage) {
      console.warn("⚠️ Missing layout or processed image → redirecting home");
      navigate("/");
      return;
    }

    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const uploadAndSend = async () => {
      try {
        setSending(true);

        // ✅ Send raw user image + layout info + email
        const uploadRes = await fetch(`${BASE_URL}/compose-final`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userImage: processedImage,
            layoutId: layout.id, // e.g., "layout1"
            email: user?.email, // include user email here
          }),
        });

        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          console.error("❌ Compose failed:", uploadData.message);
          hasRunRef.current = false;
          return;
        }

        // ✅ Save the Cloudinary-composed URL
        setFinalImageUrl(uploadData.finalUrl);

        // ✅ Check email status from backend response
        if (uploadData.emailSent) {
          setEmailSent(true);
        }

        // // ✅ Generate QR code
        // const qrRes = await fetch(`${BASE_URL}/generate-qr`, {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({ imageUrl: uploadData.finalUrl }),
        // });

        // const qrData = await qrRes.json();
        // if (qrData.success) {
        //   setQrCode(qrData.qrCode);
        // }
      } catch (err) {
        console.error("❌ Error in finalization flow:", err);
        hasRunRef.current = false;
      } finally {
        setSending(false);
      }
    };

    uploadAndSend();
  }, [layout, processedImage, user, navigate]);

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
        {/* Left: Preview of composition */}
        <div className="col-lg-6 d-flex flex-column align-items-center mb-4 mb-lg-0">
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "700px",
              textAlign: "center",
            }}
          >
            <h4>Preview</h4>

            {finalImageUrl ? (
              // 🔑 Show final Cloudinary image once ready
              <img
                src={finalImageUrl}
                alt="Final Composed"
                className="img-fluid"
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "8px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
                }}
              />
            ) : (
              // 🔑 Fallback: Local preview (layout + user overlay)
              <>
                {/* Layout background */}
                <img
                  src={layout.src}
                  alt={layout.id}
                  className="img-fluid"
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: "8px",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
                  }}
                />

                {/* User overlay */}
                <img
                  src={processedImage}
                  alt="User"
                  className="img-fluid"
                  style={{
                    position: "absolute",
                    top: "45%", // match backend gravity:center
                    left: "50%",
                    transform: "translate(-50%, -50%) translateY(100px)", // mimic y:100
                    maxHeight: "60%",
                    width: "auto",
                  }}
                />
              </>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 text-center">
            {sending && <p>Sending your final image to email...</p>}
            {emailSent && (
              <p className="text-success">✅ Email sent successfully!</p>
            )}
            <div className="mt-3">
              <button className="btn btn-danger" onClick={() => navigate("/")}>
                Home
              </button>
            </div>
          </div>
        </div>

        {/* Right: QR Code */}
        {/* <div className="col-lg-4 d-flex flex-column align-items-center mt-5 pt-5">
          {qrCode ? (
            <div className="text-center">
              <img src={qrCode} alt="QR Code" style={{ width: "250px" }} />
              <h6>Scan to download the final image</h6>
            </div>
          ) : (
            <p>Generating QR...</p>
          )}
        </div> */}
      </div>
    </div>
  );
}

export default FinalPage;
