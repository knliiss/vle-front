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
    const [role, setRole] = useState<UserRole>("STUDENT");
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            await adminApi.createUser({ username, password, role });
            onUserCreated();
            onClose();
            setUsername("");
            setPassword("");
            setRole("STUDENT");
        } catch (err) {
            console.error("Помилка створення користувача", err);
            setError("Не вдалося створити користувача. Можливо, логін вже зайнятий.");
        }
    };

    return (
        <Modal title="Створити нового користувача" show={show} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                {error && <p className="error-message">{error}</p>}
                <div className="form-group">
                    <label htmlFor="username">Ім'я користувача (логін)</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Пароль</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="role">Роль</label>
                    <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="form-control-select"
                    >
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