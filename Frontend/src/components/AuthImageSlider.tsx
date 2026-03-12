import React, { useState, useEffect } from 'react';

import loginBg from '../assets/login_bg.png';

const images = [
  loginBg
];

export function AuthImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-[2.5rem]">
      {images.map((img, index) => (
        <div
          key={img}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={img}
            alt="Background slide"
            className="object-cover w-full h-full"
          />
        </div>
      ))}
    </div>
  );
}
