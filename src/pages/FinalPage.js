import React, { useContext, useEffect, useState, useRef } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

function FinalPage() {
  const { layout, processedImage, user } = useContext(AppContext);
  const navigate = useNavigate();

  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [finalImageUrl, setFinalImageUrl] = useState(null);

  const hasRunRef = useRef(false);

  // const BASE_URL = "https://art-photobooth-1.onrender.com";
  const BASE_URL = "http://localhost:5000";

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
        setEmailSent(false);
        setEmailError(false);

        const uploadRes = await fetch(`${BASE_URL}/compose-final`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userImage: processedImage,
            layoutId: layout.id,
            email: user?.email,
          }),
        });

        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          console.error("❌ Compose failed:", uploadData.message);
          hasRunRef.current = false;
          return;
        }

        // ✅ Email status from backend
        if (uploadData.emailSent) {
          setEmailSent(true);
        } else if (user?.email) {
          setEmailError(true);
        }

        // If backend returns image path/finalUrl, set preview
        if (uploadData.finalUrl) {
          setFinalImageUrl(uploadData.finalUrl);
        }
      } catch (err) {
        console.error("❌ Error in finalization flow:", err);
        hasRunRef.current = false;
        setEmailError(true);
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
                    top: "45%",
                    left: "50%",
                    transform: "translate(-50%, -50%) translateY(100px)",
                    maxHeight: "60%",
                    width: "auto",
                  }}
                />
              </>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 text-center">
            {sending && <p>⏳ Sending your final image to email...</p>}
            {emailSent && <p className="text-success">✅ Email sent successfully!</p>}
            {emailError && <p className="text-danger">❌ Image created but email failed.</p>}

            <div className="mt-3">
              <button className="btn btn-danger" onClick={() => navigate("/")}>
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinalPage;
