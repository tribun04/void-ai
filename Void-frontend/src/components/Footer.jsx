import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-16 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 z-0">
        <svg className="w-full h-full" viewBox="0 0 1400 400" preserveAspectRatio="xMidYMid slice">
          <path
            fill="#16a085"
            d="M0,400L80,373.3C160,347,320,293,480,280C640,267,800,293,960,306.7C1120,320,1280,320,1360,320L1400,320L1400,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"
            className="animate-pulse-slow"
          />
        </svg>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" style={{ maxWidth: '1400px' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="text-center md:text-left">
            <div className="mb-4">
              <img
                src="/void.png"
                alt="Void Support System Logo"
                className="h-12 mx-auto md:mx-0 transform hover:scale-105 transition-transform duration-300"
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Void Support System empowers businesses with unified, intelligent, and scalable customer support solutions. Join our family and transform your support experience.
            </p>
          </div>

          {/* Main Pages */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Explore</h3>
            <ul className="space-y-2 text-sm">
              {[
                { name: 'Home', href: '/' },
                { name: 'About', href: '/about' },
                { name: 'Collaborate', href: '/collaborate' },
                { name: 'Contact', href: '/contact' },
                { name: 'Request a Demo', href: '/request-demo' },
              ].map((item, index) => (
                <li key={index}>
                  <a
                    href={item.href}
                    className="hover:text-[#16a085] transition-colors duration-300"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Pages */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              {[
                { name: 'Privacy Policy', href: '/privacy' },
                { name: 'Terms & Conditions', href: '/terms' },
                { name: 'Cookie Policy', href: '/cookie-policy' },
              ].map((item, index) => (
                <li key={index}>
                  <a
                    href={item.href}
                    className="hover:text-[#16a085] transition-colors duration-300"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info & Newsletter */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Stay Connected</h3>
            <ul className="space-y-2 text-sm mb-6">
              <li>
                <a
                  href="mailto:support@voidsupport.com"
                  className="hover:text-[#16a085] transition-colors duration-300 flex items-center justify-center md:justify-start"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  support@voidsupport.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+1234567890"
                  className="hover:text-[#16a085] transition-colors duration-300 flex items-center justify-center md:justify-start"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +1 (234) 567-890
                </a>
              </li>
              <li className="flex items-center justify-center md:justify-start">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                123 Support Lane, Tech City, USA
              </li>
            </ul>
            <h3 className="text-lg font-semibold text-white mb-4">Join Our Newsletter</h3>
            <form className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full sm:w-auto flex-grow px-4 py-2 rounded-md border border-gray-700 bg-gray-800 text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#16a085] transition-all duration-300"
              />
              <button
                type="submit"
                className="bg-[#16a085] hover:bg-[#13876b] text-white font-semibold px-4 py-2 rounded-md shadow-md transition-all duration-300"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="mt-10 flex justify-center space-x-6">
          {[
            { name: 'Twitter', href: 'https://twitter.com/voidsupport', icon: (
              <svg className="w-6 h-6 hover:text-[#16a085] transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 4.01c-1 .49-1.98.689-3 .99-1.121-1.265-2.783-1.335-4.38-.737S11.896 6.323 12 8v1c-3.245.083-6.135-1.395-8-4 0 0-4.182 7.433 4 11-1.872 1.247-3.739 2.088-6 2 4.308 1.784 9.654 1.143 13-1.5 3.145-2.493 4-6.141 3-10 1.122-.816 1.873-2.009 2-3.5z" />
              </svg>
            )},
            { name: 'LinkedIn', href: 'https://linkedin.com/company/voidsupport', icon: (
              <svg className="w-6 h-6 hover:text-[#16a085] transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
              </svg>
            )},
            { name: 'GitHub', href: 'https://github.com/voidsupport', icon: (
              <svg className="w-6 h-6 hover:text-[#16a085] transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            )},
          ].map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="text-gray-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.icon}
            </a>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm">
          <p>© {new Date().getFullYear()} Void Support System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}