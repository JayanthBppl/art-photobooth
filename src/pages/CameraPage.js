import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { AppContext } from "../context/AppContext";
import LoadingGif from "../assets/loading.gif";
import "../css/CameraPage.css";

const CameraPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { layoutId } = location.state || {};
  const { setProcessedImage, setLayout } = useContext(AppContext);

  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [showText, setShowText] = useState(false);
  const [showLoadingGif, setShowLoadingGif] = useState(false);
  const [countdown, setCountdown] = useState(20);
  const [showButton, setShowButton] = useState(false);

  const BASE_URL = "https://art-photobooth-1.onrender.com";

  // Trigger the "Go and take a photo" text when layout is selected
  useEffect(() => {
    if (!capturedImage && layoutId) {
      setShowText(true);

      // After 5 seconds, hide the text and show loading GIF
      const textTimer = setTimeout(() => {
        setShowText(false);
        setShowLoadingGif(true);
      }, 5000);

      return () => clearTimeout(textTimer);
    }
  }, [layoutId, capturedImage]);

  // Countdown for loading GIF before showing button
  useEffect(() => {
    if (showLoadingGif && !capturedImage) {
      setCountdown(15);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowLoadingGif(false);
            setShowButton(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showLoadingGif, capturedImage]);

  const getPhoto = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/cloudinary/latest-dslr`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      if (data.url) {
        setCapturedImage(data.url);
        setShowButton(false);
        setShowLoadingGif(false);
      } else {
        alert("No photo found. Please capture a picture first.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Error fetching photo.");
    } finally {
      setLoading(false);
    }
  };

  const retake = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/retake`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert("Last photo deleted. Please take a new one...");
        setCapturedImage(null);
        setShowButton(false);
        setShowText(false);
        setShowLoadingGif(false);
      } else {
        alert("No image to delete.");
      }
    } catch (err) {
      console.error("Retake error:", err);
      alert("Failed to delete last photo.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`${BASE_URL}/remove-bg`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filepath: capturedImage }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      if (data.success) {
        const resultImage = "data:image/png;base64," + data.data.result_b64;
        setProcessedImage(resultImage);
        setLayout({ id: layoutId, src: `/layouts/${layoutId}.png` });
        navigate("/final");
      } else {
        alert("Background removal failed.");
      }
    } catch (err) {
      console.error("Remove BG error:", err);
      alert("Something went wrong while processing the image.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex flex-column align-items-center justify-content-center bg-black text-white px-3">
      {loading ? (
        <h3>Fetching your photo...</h3>
      ) : processing ? (
        <div className="d-flex flex-column align-items-center">
          <img src={LoadingGif} alt="Processing..." className="img-fluid" style={{ maxWidth: "150px" }} />
          <p className="mt-2 text-center">Processing your image...</p>
        </div>
      ) : capturedImage ? (
        <div className="d-flex flex-column align-items-center w-100">
          <img
            src={capturedImage}
            alt="Captured"
            className="img-fluid"
            style={{ maxWidth: "90%", height: "auto", borderRadius: "10px", maxHeight: "600px" }}
          />
          <div className="d-flex flex-column flex-sm-row gap-2 mt-3">
              <button
                className="custom-btn retake-btn w-100 w-sm-auto"
                onClick={retake}
                disabled={loading || processing}
              >
                Retake
              </button>

              <button
                className="custom-btn next-btn w-100 w-sm-auto"
                onClick={handleNext}
                disabled={processing}
              >
                Next
              </button>
            </div>

        </div>
      ) : (
        <div className="d-flex flex-column align-items-center">
          {showText && <h3 className="text-center">Go and take a photo</h3>}
          {showLoadingGif && (
            <div className="d-flex flex-column align-items-center mt-3">
              <img src={LoadingGif} alt="Loading..." className="img-fluid" style={{ maxWidth: "50px" }} />
              <p className="mt-2 text-center">Preparing photo...</p>
            </div>
          )}
          {showButton && (
            <button
              className="btn btn-light mt-3"
              style={{ minWidth: "120px", padding: "10px 15px", borderRadius: "8px" }}
              onClick={getPhoto}
            >
              View Photo
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CameraPage;
