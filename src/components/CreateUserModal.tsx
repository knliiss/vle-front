import { useState } from "react";
import type { FormEvent } from "react";
import { adminApi } from "../api/apiService";
import type { UserRole } from "../types";
import Modal from "./Modal";

interface CreateUserModalProps {
    show: boolean;
    onClose: () => void;
    onUserCreated: () => void;
}

const CreateUserModal = ({ show, onClose, onUserCreated }: CreateUserModalProps) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [fio, setFio] = useState("");
    const [role, setRole] = useState<UserRole>("STUDENT");
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            await adminApi.createUser({ username, password, role, fio });
            onUserCreated();
            onClose();
            setUsername("");
            setPassword("");
            setFio("");
            setRole("STUDENT");
        } catch (err) {
            console.error(err);
            setError("Не вдалося створити користувача.");
        }
    };

    return (
        <Modal title="Створити користувача" show={show} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                {error && <p className="error-message">{error}</p>}
                <div className="form-group">
                    <label htmlFor="username">Логін</label>
                    <input type="text" id="username" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="fio">ПІБ (Повне ім'я)</label>
                    <input type="text" id="fio" value={fio} onChange={e => setFio(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Пароль</label>
                    <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="role">Роль</label>
                    <select id="role" value={role} onChange={e => setRole(e.target.value as UserRole)} className="form-control-select">
                        <option value="STUDENT">Студент</option>
                        <option value="TEACHER">Викладач</option>
                        <option value="ADMINISTRATOR">Адміністратор</option>
                    </select>
                </div>
                <button type="submit" className="btn-primary">Створити</button>
            </form>
        </Modal>
    );
};

export default CreateUserModal;