import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { adminApi } from "../api/apiService";
import type { Group, Course } from "../types";
import Modal from "./Modal";

interface BindGroupToCourseModalProps {
    show: boolean;
    onClose: () => void;
    courses: Course[];
    groups: Group[];
}

const BindGroupToCourseModal = ({ show, onClose, courses, groups }: BindGroupToCourseModalProps) => {
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [selectedGroupId, setSelectedGroupId] = useState<string>("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (courses.length > 0) setSelectedCourseId(String(courses[0].id));
        if (groups.length > 0) setSelectedGroupId(String(groups[0].id));
    }, [courses, groups]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        if (!selectedCourseId || !selectedGroupId) return;

        try {
            await adminApi.bindCourseToGroup(Number(selectedCourseId), Number(selectedGroupId));
            onClose();
        } catch (err) {
            console.error("Помилка призначення", err);
            setError("Не вдалося призначити групу.");
        }
    };

    return (
        <Modal title="Додати групу до курсу" show={show} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                {error && <p className="error-message">{error}</p>}
                <div className="form-group">
                    <label htmlFor="group">Група</label>
                    <select
                        id="group"
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="form-control-select"
                    >
                        {groups.map(group => (
                            <option key={group.id} value={group.id}>
                                {group.name}
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
                <button type="submit" className="btn-primary">Додати</button>
            </form>
        </Modal>
    );
};

export default BindGroupToCourseModal;