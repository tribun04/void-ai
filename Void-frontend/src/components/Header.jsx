import React, { useState } from "react";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-[#161616] text-white sticky top-0 z-50 shadow-lg">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        {/* Logo with hover effect */}
        <a href="/" className="flex items-center gap-2 group">
          <img 
            src="/void.png" 
            alt="Void Logo" 
            className="h-10 w-auto transition-transform group-hover:scale-105" 
          />
          
        </a>

        {/* Desktop Navigation Links */}
        <ul className="hidden md:flex items-center space-x-8">
          {[
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
            { name: "Contact", path: "/contact" },
            { name: "Collaborate", path: "/collaborate" },
          ].map((item) => (
            <li key={item.name}>
              <a
                href={item.path}
                className="text-gray-300 hover:text-[#16a085] transition-colors duration-300 text-lg font-medium"
              >
                {item.name}
              </a>
            </li>
          ))}

          {/* Request Demo Button (with primary color) */}
          <li>
            <a
              href="/request-demo"
              className="bg-[#16a085] hover:bg-[#138d76] text-white px-5 py-2 rounded-lg font-semibold transition-colors duration-300 shadow-lg hover:shadow-[#16a085]/30"
            >
              Request Demo
            </a>
          </li>
        </ul>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-gray-300 hover:text-[#16a085]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Mobile Menu (Dropdown) */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-[#161616] shadow-lg py-4 px-6">
            <ul className="flex flex-col space-y-4">
              {[
                { name: "Home", path: "/" },
                { name: "About", path: "/about" },
                { name: "Contact", path: "/contact" },
                { name: "Collaborate", path: "/collaborate" },
                { name: "Request Demo", path: "/request-demo" },
              ].map((item) => (
                <li key={item.name}>
                  <a
                    href={item.path}
                    className="block text-gray-300 hover:text-[#16a085] transition-colors duration-300 text-lg font-medium"
                    onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
}