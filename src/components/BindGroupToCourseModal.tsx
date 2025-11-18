import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { adminApi } from "../api/apiService";
import type { Group, Course } from "../types";
import Modal from "./Modal";
import { useToast } from "./ToastProvider";

interface Props {
    show: boolean;
    onClose: () => void;
    courses: Course[];
    groups: Group[];
}

const BindGroupToCourseModal = ({ show, onClose, courses, groups }: Props) => {
    const [cId, setCId] = useState("");
    const [gId, setGId] = useState("");
    const { notify } = useToast();

    useEffect(() => {
        if(courses.length) setCId(String(courses[0].id));
        if(groups.length) setGId(String(groups[0].id));
    }, [courses, groups, show]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if(!cId || !gId) return;
        try {
            await adminApi.bindCourseToGroup(Number(cId), Number(gId));
            onClose();
            notify("Групу додано до курсу", 'success');
        } catch(e) {
            console.error(e);
            notify("Помилка", 'error');
        }
    }

    return (
        <Modal title="Додати групу до курсу" show={show} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Курс</label>
                    <select value={cId} onChange={e => setCId(e.target.value)} className="form-control-select">
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Група</label>
                    <select value={gId} onChange={e => setGId(e.target.value)} className="form-control-select">
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>
                <button type="submit" className="btn-primary">Додати</button>
            </form>
        </Modal>
    )
}
export default BindGroupToCourseModal;