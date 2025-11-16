import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { adminApi } from "../api/apiService";
import type { User, Group } from "../types";
import Modal from "./Modal";

interface BindUserToGroupModalProps {
    show: boolean;
    onClose: () => void;
    user: User | null;
}

const BindUserToGroupModal = ({ show, onClose, user }: BindUserToGroupModalProps) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | string>("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (show) {
            adminApi.getGroups()
                .then(res => {
                    setGroups(res.data);
                    if (res.data.length > 0) {
                        setSelectedGroupId(user?.groupId || res.data[0].id);
                    }
                })
                .catch(() => setError("Не вдалося завантажити список груп"));
        }
    }, [show, user]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        if (!user || selectedGroupId === "") return;

        try {
            await adminApi.bindUserToGroup(user.id, Number(selectedGroupId));
            onClose();
        } catch (err) {
            console.error("Помилка призначення групи", err);
            setError("Не вдалося призначити групу.");
        }
    };

    if (!user) return null;

    return (
        <Modal title={`Призначити групу для ${user.username}`} show={show} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                {error && <p className="error-message">{error}</p>}
                <div className="form-group">
                    <label htmlFor="group">Група</label>
                    <select
                        id="group"
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                        className="form-control-select"
                    >
                        {groups.map(group => (
                            <option key={group.id} value={group.id}>
                                {group.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit" className="btn-primary">Зберегти</button>
            </form>
        </Modal>
    );
};

export default BindUserToGroupModal;