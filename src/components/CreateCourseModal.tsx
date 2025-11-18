import { useState } from "react";
import type { FormEvent } from "react";
import { adminApi } from "../api/apiService";
import Modal from "./Modal";
import { useToast } from "./ToastProvider";

interface CreateCourseModalProps {
    show: boolean;
    onClose: () => void;
    onCourseCreated: () => void;
}

const CreateCourseModal = ({ show, onClose, onCourseCreated }: CreateCourseModalProps) => {
    const [courseName, setCourseName] = useState("");
    const { notify } = useToast();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await adminApi.createCourse({ name: courseName });
            onCourseCreated();
            onClose();
            setCourseName("");
            notify("Курс створено", 'success');
        } catch (err) {
            console.error(err);
            notify("Помилка при створенні курсу", 'error');
        }
    };

    return (
        <Modal title="Новий курс" show={show} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="cname">Назва курсу</label>
                    <input type="text" id="cname" value={courseName} onChange={e => setCourseName(e.target.value)} required />
                </div>
                <button type="submit" className="btn-primary">Створити</button>
            </form>
        </Modal>
    );
};

export default CreateCourseModal;