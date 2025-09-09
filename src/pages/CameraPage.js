import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { AppContext } from "../context/AppContext";
import LoadingGif from "../assets/loading.gif";
import Arrow from "../assets/arrow.png";

const CameraPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, layoutId } = location.state || {};
  const { setProcessedImage, setLayout } = useContext(AppContext);

  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showArrow, setShowArrow] = useState(false);

  const BASE_URL = "https://art-photobooth-1.onrender.com";

  // Show arrow after 10s if no photo captured
  useEffect(() => {
    if (!capturedImage) {
      const timer = setTimeout(() => {
        setShowArrow(true);
      }, 20000);
      return () => clearTimeout(timer);
    }
  }, [capturedImage]);

  // Fetch latest DSLR image
  const getPhoto = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/cloudinary/latest-dslr`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();

      if (data.url) {
        setCapturedImage(data.url);
        setShowArrow(false);
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

  // Retake → delete last photo, then wait so user can click new photo
  const retake = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/retake`, { method: "POST" });
      const data = await res.json();

      if (data.success) {
        alert("Last photo deleted. Please take a new one...");
        setCapturedImage(null);
        setShowArrow(false);

        // Wait 3s before enabling arrow again
        setTimeout(() => {
          setShowArrow(true);
          setLoading(false);
        }, data.waitTime || 15000);
      } else {
        alert("No image to delete.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Retake error:", err);
      alert("Failed to delete last photo.");
      setLoading(false);
    }
  };

  // Background removal
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
    <div className="container-fluid vh-100 d-flex flex-column align-items-center justify-content-center bg-black text-white">
      {loading ? (
        <h3>Fetching latest photo...</h3>
      ) : processing ? (
        <div className="d-flex flex-column align-items-center">
          <img src={LoadingGif} alt="Processing..." style={{ width: "150px", height: "150px" }} />
          <p className="mt-2">Processing your image...</p>
        </div>
      ) : capturedImage ? (
        <div className="d-flex flex-column align-items-center">
          <img
            src={capturedImage}
            alt="Captured"
            style={{
              width: "450px",
              height: "600px",
              objectFit: "cover",
              borderRadius: "10px",
            }}
          />
          <div className="d-flex gap-3 mt-3">
            <button className="btn btn-warning" onClick={retake} disabled={loading || processing}>
              Retake
            </button>
            <button className="btn btn-success" onClick={handleNext} disabled={processing}>
              Next
            </button>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column align-items-center">
          <h3>Go and Take a picture</h3>
          {showArrow && (
            // <img
            //   src={Arrow}
            //   alt="Fetch photo"
            //   style={{
            //     width: "80px",
            //     height: "80px",
            //     cursor: "pointer",
            //     marginTop: "20px",
            //     border: "1px solid white",
            //     borderRadius: "40px",
            //     backgroundColor: "white",
            //   }}
            //   onClick={getPhoto}
            // />
            <button style={{width:"auto", padding:"10px 5px", borderRadius:"5px"}} onClick={getPhoto}> View Photo</button>
          )}
        </div>
      )}
    </div>
  );
};

export default CameraPage;
