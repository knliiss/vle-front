import { useState } from "react";
import type { FormEvent } from "react";
import { adminApi } from "../api/apiService";
import Modal from "./Modal";
import { useToast } from "./ToastProvider";

interface CreateTaskModalProps {
    show: boolean;
    onClose: () => void;
    topicId: number;
    onTaskCreated: () => void;
}

const CreateTaskModal = ({ show, onClose, topicId, onTaskCreated }: CreateTaskModalProps) => {
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [maxMark, setMaxMark] = useState(100);
    const [dueDate, setDueDate] = useState("");
    const { notify } = useToast();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await adminApi.createTask({
                name,
                description: desc,
                topicId,
                maxMark,
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined
            });
            onTaskCreated();
            onClose();
            setName("");
            setDesc("");
            setMaxMark(100);
            notify("Завдання створено", 'success');
        } catch (err) {
            console.error(err);
            notify("Помилка створення завдання", 'error');
        }
    };

    return (
        <Modal title="Нове завдання" show={show} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Назва</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Опис</label>
                    <input type="text" value={desc} onChange={e => setDesc(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Макс. бал</label>
                    <input type="number" value={maxMark} onChange={e => setMaxMark(Number(e.target.value))} required />
                </div>
                <div className="form-group">
                    <label>Термін здачі</label>
                    <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
                <button type="submit" className="btn-primary">Створити</button>
            </form>
        </Modal>
    );
};

export default CreateTaskModal;