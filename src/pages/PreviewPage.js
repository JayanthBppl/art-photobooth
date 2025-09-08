// // PreviewPage.js
// import React from "react";
// import { useNavigate, useLocation } from "react-router-dom";

// const PreviewPage = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const image = location.state?.image;

//   const handleNext = () => {
//     navigate("/next"); // Adjust this route to your next page
//   };

//   if (!image) {
//     return (
//       <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
//         <p>No image to preview</p>
//         <button
//           onClick={() => navigate("/camera")}
//           className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
//         >
//           Go Back
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
//       <h1 className="text-2xl font-bold mb-6">Preview</h1>

//       {/* Image with same width/height as CameraPage */}
//       <div className="flex items-center justify-center">
//         <img
//           src={image}
//           alt="Preview"
//           className="border-4 border-white rounded-lg object-cover"
//           style={{
//             width: "400px", // same as CameraPage
//             height: "700px", // same as CameraPage
//           }}
//         />
//       </div>

//       {/* Buttons */}
//       <div className="flex gap-6 mt-6">
//         <button
//           onClick={() => navigate("/camera")}
//           className="px-6 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700"
//         >
//           Retake
//         </button>

//         <button
//           onClick={handleNext}
//           className="px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
//         >
//           Next
//         </button>
//       </div>
//     </div>
//   );
// };

// export default PreviewPage;
