// import React, { useContext } from "react";
// import { useNavigate } from "react-router-dom";
// import { AppContext } from "../context/AppContext";
// import "../css/LayoutSelection.css";

// function LayoutSelection() {
//   const { setLayout } = useContext(AppContext);
//   const navigate = useNavigate();

//   const layouts = [
//     { id: "layout1", src: "/layouts/layout1.png" },
//     { id: "layout2", src: "/layouts/layout2.png" },
   
//   ];

//   const chooseLayout = (layout) => {
//     setLayout(layout);
//     navigate("/camera");
//   };

//   // Decide column size based on number of layouts
//   const colSize =
//     layouts.length === 2 ? "col-md-6" : layouts.length === 4 ? "col-md-6 col-lg-6" : "col-md-12";

//   return (
//     <div className="layout-selection-container text-center">
//       <h2 className="header pb-5">Select Layout</h2>
//       <div className="row mt-2">
//         {layouts.map((layout) => (
//           <div key={layout.id} className={`${colSize} mb-4 d-flex justify-content-center`}>
//             <div className="card" onClick={() => chooseLayout(layout)}>
//               <img
//                 src={layout.src}
//                 alt={layout.id}
//                 className="card-img-top"
//                 style={{
//                   height: "140px",
//                   width: "450px",
//                   objectFit: "fill",
//                 }}
//               />
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default LayoutSelection;
