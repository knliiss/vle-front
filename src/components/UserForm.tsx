import React, { useState } from "react";
import type { User } from "../types";
import Modal from "./Modal";

interface Props {
    open: boolean;
    initial?: User | null;
    onClose: () => void;
    onSaved: (user: User) => void;
}

const UserForm: React.FC<Props> = ({ open, initial, onClose, onSaved }) => {
    const [username, setUsername] = useState(initial?.username || "");
    const [role, setRole] = useState<User["role"]>(initial?.role || "STUDENT");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        setUsername(initial?.username || "");
        setRole(initial?.role || "STUDENT");
    }, [initial, open]);

    const handleSave = async () => {
        setError(null);
        if (!username.trim()) {
            setError("Username is required");
            return;
        }
        setLoading(true);
        try {
            const saved: User = initial ? { ...initial, username, role } : { id: Date.now(), username, role } as User;
            onSaved(saved);
            onClose();
        } catch (err: any) {
            setError(err?.message || "Failed to save user");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={initial ? "Edit User" : "Create User"}>
            <div className="form-group">
                <label>Username</label>
                <input className="field" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="form-group">
                <label>Role</label>
                <select className="field" value={role} onChange={(e) => setRole(e.target.value as any)}>
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="ADMINISTRATOR">Administrator</option>
                </select>
            </div>
            {error && <div className="error-message">{error}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save"}</button>
            </div>
        </Modal>
    );
};

export default UserForm;

