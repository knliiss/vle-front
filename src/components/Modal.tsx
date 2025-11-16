import React, { useEffect, useRef } from "react";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children?: React.ReactNode;
    size?: "sm" | "md" | "lg";
}

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, size = "md" }) => {
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const firstFocusRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        if (open) {
            document.addEventListener("keydown", onKey);
            setTimeout(() => {
                const el = firstFocusRef.current?.querySelector("input, button, select, textarea");
                (el as HTMLElement | null)?.focus();
            }, 0);
        }
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="modal-overlay" ref={overlayRef} onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}>
            <div className={`modal-window modal-${size}`} role="dialog" aria-modal="true" aria-label={title || "Modal"} ref={firstFocusRef}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="btn btn-secondary btn-small" onClick={onClose} aria-label="close">Закрити</button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
