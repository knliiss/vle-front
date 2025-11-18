import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { adminApi } from "../api/apiService";
import type { User, Course } from "../types";
import Modal from "./Modal";
import { useToast } from "./ToastProvider";

interface Props {
    show: boolean;
    onClose: () => void;
    courses: Course[];
    users: User[];
}

const BindTeacherToCourseModal = ({ show, onClose, courses, users }: Props) => {
    const [cId, setCId] = useState("");
    const [tId, setTId] = useState("");

    const teachers = users.filter(u => u.role === 'TEACHER');
    const { notify } = useToast();

    useEffect(() => {
        if(courses.length) setCId(String(courses[0].id));
        if(teachers.length) setTId(String(teachers[0].id));
    }, [courses, users, show]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if(!cId || !tId) return;
        try {
            await adminApi.bindTeacherToCourse(Number(tId), Number(cId));
            onClose();
            notify("Викладача призначено", 'success');
        } catch(e) {
            console.error(e);
            notify("Помилка призначення", 'error');
        }
    }

    return (
        <Modal title="Призначити викладача" show={show} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Курс</label>
                    <select value={cId} onChange={e => setCId(e.target.value)} className="form-control-select">
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Викладач</label>
                    <select value={tId} onChange={e => setTId(e.target.value)} className="form-control-select">
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.fio || t.username}</option>)}
                    </select>
                </div>
                <button type="submit" className="btn-primary">Призначити</button>
            </form>
        </Modal>
    )
}
export default BindTeacherToCourseModal;