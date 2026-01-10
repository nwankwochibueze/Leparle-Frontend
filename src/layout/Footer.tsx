import React from 'react';
import { FiInstagram, FiFacebook, FiLinkedin } from 'react-icons/fi';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-300 border-b">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <div className="flex flex-col items-start">
            <h2 className="text-2xl sm:text-3xl font-serif mb-4">Le Parle`</h2>
            
            <div className="flex items-center">
              <a
                href="#"
                className="flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <FiInstagram className="w-6 h-6 text-black" />
              </a>
              <a
                href="#"
                className="flex items-center justify-center ml-4 transition-colors"
                aria-label="Facebook"
              >
                <FiFacebook className="w-6 h-6 text-black" />
              </a>
              <a
                href="#"
                className="flex items-center justify-center ml-4 transition-colors"
                aria-label="LinkedIn"
              >
                <FiLinkedin className="w-6 h-6 text-black" />
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-2 text-gray-800">
            <p className="text-base sm:text-lg">1234-56-7890</p>
            <p className="text-base sm:text-lg">info@mysite.com</p>
            <p className="text-base sm:text-lg mt-4">500 Terry Francine St.</p>
            <p className="text-base sm:text-lg">San Francisco, CA 94158</p>
          </div>

          <div className="flex flex-col items-start sm:items-end space-y-6">
            <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0 text-gray-800">
              <a href="#" className="hover:underline text-base sm:text-lg">
                Privacy Policy
              </a>
              <a href="#" className="hover:underline text-base sm:text-lg">
                Accessibility Statement
              </a>
            </div>

            <div className="text-left sm:text-right text-gray-800">
              <p className="text-base sm:text-lg">© 2025 by Le Parle`</p>
              <p className="text-base sm:text-lg">
                Powered and secured by{' '}
                <a href="#" className="underline hover:no-underline">
                  nwa.nwko
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;