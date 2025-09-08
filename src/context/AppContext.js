import React, { createContext, useState } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [layout, setLayout] = useState(null); // Stores layout info
  const [capturedImage, setCapturedImage] = useState(null); // Stores raw captured image
  const [processedImage, setProcessedImage] = useState(null); // Stores BG removed image
  const [selectedTemplate, setSelectedTemplate] = useState(null); // Stores chosen template
  const [user, setUser] = useState(null); // ✅ Stores user's name & email

  return (
    <AppContext.Provider
      value={{
        layout,
        setLayout,
        capturedImage,
        setCapturedImage,
        processedImage,
        setProcessedImage,
        selectedTemplate,
        setSelectedTemplate,
        user,
        setUser, // ✅ added user setter
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
