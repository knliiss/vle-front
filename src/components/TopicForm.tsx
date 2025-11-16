import React, { useState } from "react";
import type { Topic } from "../types";
import Modal from "./Modal";

interface Props {
    open: boolean;
    initial?: Topic | null;
    courseId?: number;
    onClose: () => void;
    onSaved: (topic: Topic) => void;
}

const TopicForm: React.FC<Props> = ({ open, initial, courseId, onClose, onSaved }) => {
    const [name, setName] = useState(initial?.name || "");
    const [description, setDescription] = useState(initial?.description || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        setName(initial?.name || "");
        setDescription(initial?.description || "");
    }, [initial, open]);

    const handleSave = async () => {
        setError(null);
        if (!name.trim()) {
            setError("Topic name is required");
            return;
        }
        setLoading(true);
        try {
            const saved: Topic = initial ? { ...initial, name, description } : { id: Date.now(), name, description, courseId } as Topic;
            onSaved(saved);
            onClose();
        } catch (err: any) {
            setError(err?.message || "Failed to save topic");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={initial ? "Edit Topic" : "Create Topic"}>
            <div className="form-group">
                <label>Name</label>
                <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
                <label>Description</label>
                <textarea className="field" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            {error && <div className="error-message">{error}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save"}</button>
            </div>
        </Modal>
    );
};

export default TopicForm;

