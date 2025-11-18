import { useState } from "react";
import type { FormEvent } from "react";
import { adminApi } from "../api/apiService";
import Modal from "./Modal";
import { useToast } from "./ToastProvider";

interface CreateTopicModalProps {
    show: boolean;
    onClose: () => void;
    courseId: number;
    onTopicCreated: () => void;
}

const CreateTopicModal = ({ show, onClose, courseId, onTopicCreated }: CreateTopicModalProps) => {
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const { notify } = useToast();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await adminApi.createTopic({ name, description: desc, courseId });
            onTopicCreated();
            onClose();
            setName("");
            setDesc("");
            notify("Тему створено", 'success');
        } catch (err) {
            console.error(err);
            notify("Помилка створення теми", 'error');
        }
    };

    return (
        <Modal title="Нова тема" show={show} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Назва теми</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Опис</label>
                    <input type="text" value={desc} onChange={e => setDesc(e.target.value)} />
                </div>
                <button type="submit" className="btn-primary">Створити</button>
            </form>
        </Modal>
    );
};

export default CreateTopicModal;