import React, { useState } from "react";
import type { Course } from "../types";
import Modal from "./Modal";

interface Props {
    open: boolean;
    initial?: Course | null;
    onClose: () => void;
    onSaved: (course: Course) => void;
}

const CourseForm: React.FC<Props> = ({ open, initial, onClose, onSaved }) => {
    const [name, setName] = useState(initial?.name || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        setName(initial?.name || "");
    }, [initial, open]);

    const handleSave = async () => {
        setError(null);
        if (!name.trim()) {
            setError("Course name is required");
            return;
        }
        setLoading(true);
        try {
            const saved: Course = initial ? { ...initial, name } : { id: Date.now(), name } as Course;
            onSaved(saved);
            onClose();
        } catch (err: any) {
            setError(err?.message || "Failed to save course");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={initial ? "Edit Course" : "Create Course"}>
            <div className="form-group">
                <label>Name</label>
                <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            {error && <div className="error-message">{error}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save"}</button>
            </div>
        </Modal>
    );
};

export default CourseForm;

