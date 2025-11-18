import { useState } from "react";
import type { FormEvent } from "react";
import { adminApi } from "../api/apiService";
import Modal from "./Modal";
import { useToast } from "./ToastProvider";

interface CreateGroupModalProps {
    show: boolean;
    onClose: () => void;
    onGroupCreated: () => void;
}

const CreateGroupModal = ({ show, onClose, onGroupCreated }: CreateGroupModalProps) => {
    const [groupName, setGroupName] = useState("");
    const { notify } = useToast();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await adminApi.createGroup({ name: groupName });
            onGroupCreated();
            onClose();
            setGroupName("");
            notify("Групу створено", 'success');
        } catch (err) {
            console.error(err);
            notify("Помилка при створенні групи", 'error');
        }
    };

    return (
        <Modal title="Нова група" show={show} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="gname">Назва групи</label>
                    <input type="text" id="gname" value={groupName} onChange={e => setGroupName(e.target.value)} required />
                </div>
                <button type="submit" className="btn-primary">Створити</button>
            </form>
        </Modal>
    );
};

export default CreateGroupModal;