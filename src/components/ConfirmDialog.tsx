import React from "react";

interface ConfirmDialogProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    message?: string;
    title?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ open, onConfirm, onCancel, message = "Підтвердити дію?", title = "Підтвердження" }) => {
    if (!open) return null;
    return (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
            <div className="modal-content" role="dialog" aria-modal="true" aria-label={title}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="modal-close-btn" onClick={onCancel}>&times;</button>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div style={{ display:'flex', gap:8, justifyContent:'flex-end', padding:'0 1.5rem 1.25rem' }}>
                    <button className="btn-secondary" onClick={onCancel}>Скасувати</button>
                    <button className="btn-danger" onClick={onConfirm}>Підтвердити</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
