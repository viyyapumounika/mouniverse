import React, { useState, useEffect } from "react";
import logo from "../assets/Gemini_Generated_Image_5nzmff5nzmff5nzm-removebg-preview.png";

import "./SplashScreen.css";

// Array of background images for the slider
const sliderImages = [
  "https://images.alphacoders.com/133/1333345.jpeg", // Oppenheimer
  "https://images.alphacoders.com/131/1312433.jpg", // John Wick 4
  "https://images.alphacoders.com/132/1329042.jpeg", // Avatar 2
];

const SplashScreen = ({ onFinish }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // This effect handles the image sliding every 1 second
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentImageIndex(prevIndex =>
        prevIndex === sliderImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 1000); // Slide every 1 second as requested

    return () => clearInterval(slideTimer);
  }, []);

  // This effect handles finishing the splash screen after a total duration
  useEffect(() => {
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 1000) // Keep total time to 5 seconds

    return () => clearTimeout(finishTimer);
  }, [onFinish]);

  return (
    <div className="splash">
      {/* Image Slider */}
      <div className="splash-slider">
        {sliderImages.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Splash background ${index + 1}`}
            className={`splash-image ${index === currentImageIndex ? "active" : ""}`}
          />
        ))}
      </div>

      {/* Dark overlay */}
      <div className="overlay"></div>

      <div className="logo-wrapper">
        {/* Logo */}
        <img src={logo} alt="MouniVerse" className="logo" />
      </div>

      {/* Loader */}
      <div className="loader">
        <span></span>
        <span></span>
        <span></span>
      </div>
      
      {/* Styles to make the slider fullscreen */}
      <style>{`
        .splash-slider {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }
        .splash-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover; /* This makes the image cover the full screen */
          opacity: 0;
          transition: opacity 0.5s ease-in-out; /* Smooth fade transition */
        }
        .splash-image.active {
          opacity: 1;
        }
      `}</style>

    </div>
  );
};

export default SplashScreen;