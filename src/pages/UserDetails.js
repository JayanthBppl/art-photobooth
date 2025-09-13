import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import "../css/UserDetails.css";
import "../css/LayoutSelection.css";

function UserAndLayoutPage() {
  const { user, setUser, setLayout } = useContext(AppContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const layouts = [
    { id: "layout1", src: "/layouts/layout1.png" },
    { id: "layout2", src: "/layouts/layout2.png" },
    // add more layouts if needed
  ];

  // const BASE_URL = "https://art-photobooth-1.onrender.com";
  const BASE_URL = "http://localhost:5000";

  // Preload layout images after form submission
  useEffect(() => {
    if (formSubmitted) {
      const promises = layouts.map(layout => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = `${process.env.PUBLIC_URL}${layout.src}`;
          img.onload = resolve;
          img.onerror = resolve;
        });
      });

      Promise.all(promises).then(() => setImagesLoaded(true));
    }
  }, [formSubmitted]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        userId: user._id,
        layoutId: layout.id,
      },
    });
  };

  return (
    <div className="container py-5">
      {/* Logo */}
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
        <div
          className="card shadow user-form-card mx-auto"
          style={{ maxWidth: "500px" }}
        >
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
      {formSubmitted && (
        <div className="layout-selection-container text-center">
          <h2 className="header mb-4">Select Layout</h2>

          {!imagesLoaded ? (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ minHeight: "200px" }}
            >
              <div
                className="spinner-border text-primary"
                role="status"
                style={{ width: "3rem", height: "3rem" }}
              >
                <span className="visually-hidden">Loading layouts...</span>
              </div>
              <p className="mt-2 ms-3">Loading layouts...</p>
            </div>
          ) : (
            <div className="layout-grid d-flex flex-column flex-md-row gap-3 justify-content-center align-items-center">
              {layouts.map((layout) => (
                <div
                  key={layout.id}
                  onClick={() => chooseLayout(layout)}
                  style={{ cursor: "pointer", width: "100%", maxWidth: "400px" }}
                >
                  <img
                    src={`${process.env.PUBLIC_URL}${layout.src}`}
                    alt={layout.id}
                    className="card-img-top img-fluid"
                    style={{
                      width: "100%",
                      height: "auto",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UserAndLayoutPage;
