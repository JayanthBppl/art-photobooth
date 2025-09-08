import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import "../css/UserDetails.css";
import "../css/LayoutSelection.css";

function UserAndLayoutPage() {
  const {user, setUser, setLayout } = useContext(AppContext);
  
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const layouts = [
    { id: "layout1", src: "/layouts/layout1.png" },
    { id: "layout2", src: "/layouts/layout2.png" },
    { id: "layout3", src: "/layouts/layout3.png" },
    { id: "layout4", src: "/layouts/layout4.png" },
  ];

  const BASE_URL = process.env.REACT_APP_BACKEND_URL;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      alert("Please fill in both fields");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/save-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        console.log("✅ User saved to backend:", data.user);
        setFormSubmitted(true);
      } else {
        alert("Failed to save user");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

 const chooseLayout = (layout) => {
  setLayout(layout);

  if (!user) {
    alert("User not found! Please fill your details first.");
    return;
  }

  navigate("/camera", { 
    state: { 
      userId: user._id, // or user.id depending on backend
      layoutId: layout.id
    } 
  });
};


  return (
    <div className="container py-5">
      {/* Logo only for form */}
      {!formSubmitted && (
        <div className="text-center mb-4">
          <img
            src={`${process.env.PUBLIC_URL}/logo.png`}
            alt="Logo"
            className="logo mb-3 img-fluid"
            style={{ maxWidth: "180px" }}
          />

        </div>
      )}

      {/* STEP 1: User Details Form */}
      {!formSubmitted && (
        <div className="card shadow user-form-card mx-auto" style={{ maxWidth: "500px" }}>
          <div className="card-body text-center">
            <h2 className="mb-4 fs-5">Enter Your Details</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3 text-start">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                />
              </div>

              <div className="mb-3 text-start">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading ? "Saving..." : "Continue"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STEP 2: Layout Selection */}
      {/* STEP 2: Layout Selection */}
      {formSubmitted && (
        <div className="layout-selection-container text-center">
          <h2 className="header">Select Layout</h2>
          <div className="layout-grid">
            {layouts.map(layout => (
              <div key={layout.id} onClick={() => chooseLayout(layout)} style={{ cursor: "pointer" }}>
                <img
                  src={`${process.env.PUBLIC_URL}${layout.src}`}
                  alt={layout.id}
                  className="card-img-top img-fluid"
                  style={{ objectFit: "cover", height: "220px" }}
                />
              </div>
            ))}


          </div>
        </div>
      )}



    </div>
  );
}

export default UserAndLayoutPage;
