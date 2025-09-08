import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { AppContext } from "../context/AppContext";
import LoadingGif from "../assets/loading.gif";
import Arrow from '../assets/arrow.png';

const CameraPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, layoutId } = location.state || {};
  const { setProcessedImage, setLayout } = useContext(AppContext);

  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showArrow, setShowArrow] = useState(false); // New state

  const BASE_URL = process.env.REACT_APP_BACKEND_URL;


  // Show arrow after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowArrow(true);
    }, 10000); // 10000ms = 10s

    return () => clearTimeout(timer); // Cleanup on unmount
  }, []);

  const getPhoto = async () => {
    if (!userId) return alert("User ID not found.");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/capture/${userId}`);
      const data = await res.json();
      if (data.success && data.filepath) {
        setCapturedImage(data.filepath);
      } else {
        alert("No photo found. Please take a picture first.");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching photo.");
    } finally {
      setLoading(false);
    }
  };

  const retake = async () => {
    try {
      await fetch(`${BASE_URL}/retake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      setCapturedImage(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNext = async () => {
    try {
      setProcessing(true);
      const res = await fetch(`${BASE_URL}/remove-bg`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filepath: capturedImage }),
      });
      const data = await res.json();
      if (data.success) {
        const resultImage = "data:image/png;base64," + data.data.result_b64;
        setProcessedImage(resultImage);
        setLayout({ id: layoutId, src: `/layouts/${layoutId}.png` });
        navigate("/final");
      } else {
        alert("BG removal failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex flex-column align-items-center justify-content-center bg-black text-white">
      {loading ? (
        <h3>Fetching latest photo from DSLR...</h3>
      ) : processing ? (
        <div className="d-flex flex-column align-items-center">
          <img src={LoadingGif} alt="Loading" style={{ width: "150px", height: "150px" }} />
        </div>
      ) : capturedImage ? (
        <div className="d-flex flex-column align-items-center">
          <img
            src={`${BASE_URL}${capturedImage}`}
            alt="Captured"
            style={{ width: "450px", height: "600px", objectFit: "cover", borderRadius: "10px" }}
          />
          <div className="d-flex gap-3 mt-3">
            <button className="btn btn-warning" onClick={retake}>
              Retake
            </button>
            <button className="btn btn-success" onClick={handleNext}>
              Next
            </button>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column align-items-center">
          <h3>Go and Take a picture</h3>
          {showArrow && (  // Show only after 10 seconds
            <img
              src={Arrow}
              alt="next page"
              style={{
                width: "80px",
                height: "80px",
                cursor: "pointer",
                marginTop: "20px",
                border: "1px solid white",
                borderRadius: "40px",
                backgroundColor: "white",
              }}
              onClick={getPhoto}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default CameraPage;
