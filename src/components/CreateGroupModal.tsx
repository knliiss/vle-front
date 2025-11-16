import { useState } from "react";
import type { FormEvent } from "react";
import { adminApi } from "../api/apiService";
import Modal from "./Modal";

interface CreateGroupModalProps {
    show: boolean;
    onClose: () => void;
    onGroupCreated: () => void;
}

const CreateGroupModal = ({ show, onClose, onGroupCreated }: CreateGroupModalProps) => {
    const [groupName, setGroupName] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await adminApi.createGroup({ name: groupName });
            onGroupCreated();
            onClose();
            setGroupName("");
        } catch (err) {
            console.error("Помилка створення групи", err);
            setError("Не вдалося створити групу.");
        }
    };

    return (
        <Modal title="Створити нову групу" show={show} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                {error && <p className="error-message">{error}</p>}
                <div className="form-group">
                    <label htmlFor="groupName">Назва групи (напр. КН-301)</label>
                    <input
                        type="text"
                        id="groupName"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn-primary">Створити</button>
            </form>
        </Modal>
    );
};

export default CreateGroupModal;