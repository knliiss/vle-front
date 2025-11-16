import React from "react";

interface ConfirmDialogProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    message?: string;
    title?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ open, onConfirm, onCancel, message = "Are you sure?", title = "Confirm" }) => {
    if (!open) return null;
    return (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
            <div className="modal-window modal-sm" role="dialog" aria-modal="true" aria-label={title}>
                <div className="modal-header">
                    <h3>{title}</h3>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onCancel}>Відмінити</button>
                    <button className="btn btn-danger" onClick={onConfirm}>Підтвердити</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;

