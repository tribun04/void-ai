import React from 'react';

// This is a VISUAL PREVIEW ONLY. It has no live functionality.
// It is now updated to accept a 'config' prop to dynamically display settings.
export function TechAiModalPreview({ isOpen, onClose, config }) {
    if (!isOpen) return null;

    // Use values from the config prop with sensible fallbacks
    const companyName = config?.companyName || 'Your Company Name';
    const welcomeMessage = config?.welcomeMessage || 'Our virtual assistant is here to help. Ask a question to get started.';
    const brandColor = config?.brandColor || '#4F46E5'; // Default to a nice indigo
    
    // Use the English placeholder as a default for the preview
    const inputPlaceholder = config?.languages?.en?.inputPlaceholder || 'Type your question here...';

    return (
        <div className={`fixed inset-0 flex items-end justify-end p-4 sm:p-6 z-[9999]`}>
            {/* Backdrop */}
            <div className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm`} onClick={onClose} />
            
            {/* Modal Content */}
            <div className={`relative w-full max-w-lg bg-[#1A1D24] rounded-2xl transform transition-all duration-300 ease-out border border-[#2A2F3B] flex flex-col`} style={{ height: 'calc(100vh - 4rem)', maxHeight: '700px' }}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#2A2F3B] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {/* DYNAMIC: Brand color applied to the icon background */}
                        <div className="rounded-lg p-2 shadow-lg" style={{ backgroundColor: brandColor }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                            {/* DYNAMIC: Company name */}
                            <h2 className="text-lg font-semibold text-white">{companyName}</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                {/* Chat Body */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        {/* DYNAMIC: Company name in welcome block */}
                        <h3 className="text-xl font-semibold text-white mb-2">{companyName}</h3>
                        {/* DYNAMIC: Welcome message */}
                        <p className="text-gray-400 text-sm">{welcomeMessage}</p>
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-[#2A2F3B] flex-shrink-0 relative">
                    {/* DYNAMIC: Input placeholder text */}
                    <textarea 
                        className="w-full p-4 pr-12 bg-[#2A2F3B] text-white rounded-xl" 
                        placeholder={inputPlaceholder}
                        rows={1}
                        readOnly // It's just a preview
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                        {/* DYNAMIC: Brand color applied to send button */}
                        <button className="p-2 rounded-full text-white" style={{ backgroundColor: brandColor }}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}