import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { adminApi } from "../api/apiService";
import type { User, Course } from "../types";
import Modal from "./Modal";

interface BindTeacherToCourseModalProps {
    show: boolean;
    onClose: () => void;
    courses: Course[];
    users: User[];
}

const BindTeacherToCourseModal = ({ show, onClose, courses, users }: BindTeacherToCourseModalProps) => {
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
    const [error, setError] = useState("");

    const teachers = users.filter(u => u.role === 'TEACHER');

    useEffect(() => {
        if (courses.length > 0) setSelectedCourseId(String(courses[0].id));
        if (teachers.length > 0) setSelectedTeacherId(String(teachers[0].id));
    }, [courses, teachers]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        if (!selectedCourseId || !selectedTeacherId) return;

        try {
            await adminApi.bindTeacherToCourse(Number(selectedTeacherId), Number(selectedCourseId));
            onClose();
        } catch (err) {
            console.error("Помилка призначення", err);
            setError("Не вдалося призначити викладача.");
        }
    };

    return (
        <Modal title="Призначити викладача на курс" show={show} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                {error && <p className="error-message">{error}</p>}
                <div className="form-group">
                    <label htmlFor="teacher">Викладач</label>
                    <select
                        id="teacher"
                        value={selectedTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                        className="form-control-select"
                    >
                        {teachers.map(teacher => (
                            <option key={teacher.id} value={teacher.id}>
                                {teacher.username}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="course">Курс</label>
                    <select
                        id="course"
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="form-control-select"
                    >
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>
                                {course.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit" className="btn-primary">Призначити</button>
            </form>
        </Modal>
    );
};

export default BindTeacherToCourseModal;