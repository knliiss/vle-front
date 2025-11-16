import { useState } from "react";
import type { FormEvent } from "react";
import { adminApi } from "../api/apiService";
import Modal from "./Modal";

interface CreateCourseModalProps {
    show: boolean;
    onClose: () => void;
    onCourseCreated: () => void;
}

const CreateCourseModal = ({ show, onClose, onCourseCreated }: CreateCourseModalProps) => {
    const [courseName, setCourseName] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await adminApi.createCourse({ name: courseName });
            onCourseCreated();
            onClose();
            setCourseName("");
        } catch (err) {
            console.error("Помилка створення курсу", err);
            setError("Не вдалося створити курс.");
        }
    };

    return (
        <Modal title="Створити новий курс" show={show} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                {error && <p className="error-message">{error}</p>}
                <div className="form-group">
                    <label htmlFor="courseName">Назва курсу</label>
                    <input
                        type="text"
                        id="courseName"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn-primary">Створити</button>
            </form>
        </Modal>
    );
};

export default CreateCourseModal;