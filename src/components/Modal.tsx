import type { ReactNode } from 'react';

interface ModalProps {
    show: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

const Modal = ({ show, onClose, title, children }: ModalProps) => {
    if (!show) {
        return null;
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;