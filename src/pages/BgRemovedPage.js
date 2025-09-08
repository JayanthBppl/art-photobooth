// import React, { useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { useContext } from "react";
// import { AppContext } from "../context/AppContext";

// function BgRemovedPage() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { setProcessedImage } = useContext(AppContext);

//   const capturedImage = location.state?.image; // image from CameraPage
//   const [loading, setLoading] = useState(false);
//   const [preview, setPreview] = useState(null);

//   useEffect(() => {
//     if (!capturedImage) {
//       navigate("/camera");
//       return;
//     }
//     removeBackground();
//     // eslint-disable-next-line
//   }, [capturedImage]);

//   const removeBackground = async () => {
//     try {
//       setLoading(true);

//       // Convert data URL to Blob
//       const blob = await fetch(capturedImage).then((res) => res.blob());
//       const formData = new FormData();
//       formData.append("image", blob, "capture.png"); // ✅ matches multer.single("image")

//       const response = await axios.post(
//         "http://localhost:5000/remove-bg",
//         formData,
//         { headers: { "Content-Type": "multipart/form-data" } }
//       );

//       const resultImage =
//         "data:image/png;base64," + response.data.data.result_b64;
//       setPreview(resultImage);
//     } catch (err) {
//       console.error("BG Removal Error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };
//   const handleNext = () => {
//   setProcessedImage(preview);   // ✅ save in context
//   navigate("/final");           // no need to pass state
// };

//   return (
//     <div style={{ textAlign: "center", padding: "20px" }}>
//       <h2>Background Removed Preview</h2>
//       {loading && <p>Processing image...</p>}

//       {preview && (
//         <div>
//           <img src={preview} alt="Result" style={{ maxWidth: "70%", margin: "20px" }} />
//           <br />
//           <button
//             onClick={handleNext}
//             style={{
//               marginTop: "15px",
//               padding: "10px 20px",
//               fontSize: "16px",
//               backgroundColor: "#28a745",
//               color: "#fff",
//               border: "none",
//               borderRadius: "6px",
//               cursor: "pointer",
//             }}
//           >
//             Next
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// export default BgRemovedPage;
