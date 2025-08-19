import React, { useEffect, useMemo, useRef } from "react";

/**
 * TechAiModalPreview
 * Visual PREVIEW of a chat modal. No live send functionality.
 * Forward‑looking improvements:
 *  - Config‑driven theming & i18n fallbacks
 *  - Safe viewport units (100svh) with maxHeight cap
 *  - Accessible dialog semantics (role, aria-*, Esc to close)
 *  - Focus management + simple focus trap
 *  - Backdrop click to close (outside modal only)
 *  - Reduced motion friendly transitions
 */

export function TechAiModalPreview({ isOpen, onClose, config }) {
    if (!isOpen) return null;

    // Config with sensible fallbacks
    const companyName = config?.companyName || "Your Company Name";
    const welcomeMessage =
        config?.welcomeMessage ||
        "Our virtual assistant is here to help. Ask a question to get started.";
    const brandColor = config?.brandColor || "#4F46E5"; // indigo
    const logoUrl = config?.logoUrl || null; // optional brand logo

    // i18n placeholder: prefer explicit locale, then en, then default
    const locale = config?.locale || "en";
    const inputPlaceholder =
        config?.languages?.[locale]?.inputPlaceholder ||
        config?.languages?.en?.inputPlaceholder ||
        "Type your question here...";

    const titleId = useMemo(() => `techai-title-${Math.random().toString(36).slice(2)}`, []);
    const descId = useMemo(() => `techai-desc-${Math.random().toString(36).slice(2)}`, []);

    const dialogRef = useRef(null);
    const textareaRef = useRef(null);

    // Focus management + Esc to close
    useEffect(() => {
        const dialog = dialogRef.current;
        const firstFocusable = dialog?.querySelector(
            'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) firstFocusable.focus();

        function onKeydown(e) {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose?.();
            }
            if (e.key === "Tab") {
                // Simple focus trap
                const focusables = dialog.querySelectorAll(
                    'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
                );
                const list = Array.from(focusables).filter((el) => !el.hasAttribute("disabled"));
                if (list.length === 0) return;
                const currentIndex = list.indexOf(document.activeElement);
                let nextIndex = currentIndex + (e.shiftKey ? -1 : 1);
                if (nextIndex >= list.length) nextIndex = 0;
                if (nextIndex < 0) nextIndex = list.length - 1;
                if (!dialog.contains(document.activeElement)) {
                    // if focus escapes, bring it back
                    e.preventDefault();
                    list[0].focus();
                } else if (currentIndex !== -1) {
                    e.preventDefault();
                    list[nextIndex].focus();
                }
            }
        }

        document.addEventListener("keydown", onKeydown);
        return () => document.removeEventListener("keydown", onKeydown);
    }, [onClose]);

    // Auto focus textarea after mount (preview only)
    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    // Backdrop close when clicking outside the dialog card
    function onBackdropClick(e) {
        if (e.target === e.currentTarget) onClose?.();
    }

    return (
        <div className="fixed inset-0 z-[9999]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onBackdropClick}
            />

            {/* Modal container aligned bottom-right */}
            <div className="absolute inset-0 flex items-end justify-end p-4 sm:p-6">
                {/* Card */}
                <section
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    aria-describedby={descId}
                    className="relative w-full max-w-lg rounded-2xl border flex flex-col bg-[#1A1D24] border-[#2A2F3B] shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                    style={{ height: "min(700px, calc(100svh - 2rem))" }}
                >
                    {/* Header */}
                    <header className="flex items-center justify-between p-4 border-b border-[#2A2F3B] flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div
                                className="rounded-lg p-2 shadow-lg"
                                style={{ backgroundColor: brandColor }}
                                aria-hidden
                            >
                                {logoUrl ? (
                                    <img src={logoUrl} alt="" className="h-6 w-6 object-contain" />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h2 id={titleId} className="text-lg font-semibold text-white">
                                    {companyName}
                                </h2>
                                <p id={descId} className="sr-only">
                                    Chat assistant preview modal.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white p-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                            aria-label="Close"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </header>

                    {/* Body */}
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                            <h3 className="text-xl font-semibold text-white mb-2">{companyName}</h3>
                            <p className="text-gray-400 text-sm">{welcomeMessage}</p>
                        </div>
                    </div>

                    {/* Composer (preview only) */}
                    <footer className="p-4 border-t border-[#2A2F3B] flex-shrink-0 relative">
                        <div className="relative flex items-center">
                            <label htmlFor="techai-input" className="sr-only">
                                Type your message
                            </label>
                            <textarea
                                id="techai-input"
                                ref={textareaRef}
                                className="w-full p-4 pr-12 bg-[#2A2F3B] text-white rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20"
                                placeholder={inputPlaceholder}
                                rows={1}
                                readOnly
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <button
                                    className="p-2 rounded-full text-white shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                                    style={{ backgroundColor: brandColor }}
                                    aria-label="Send"
                                    disabled
                                    title="Preview only"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </footer>
                </section>
            </div>
        </div>
    );
}

// Suggested evolutions:
// - Promote brandColor to a CSS custom property and theme tokens.
// - Add entry/exit animations with reduced-motion fallbacks.
// - Optional props: position (corner), size (sm/md/lg), compact mode.
// - Wire to a real chat input with Enter-to-send and Shift+Enter newline.
