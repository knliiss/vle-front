import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/apiService";

const LoginPage = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { login, user } = useAuth();

    useEffect(() => {
        if (user) {
            switch (user.role) {
                case "ADMINISTRATOR":
                    navigate("/admin");
                    break;
                case "TEACHER":
                    navigate("/teacher");
                    break;
                case "STUDENT":
                    navigate("/student");
                    break;
                default:
                    navigate("/login");
            }
        }
    }, [user, navigate]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const response = await authApi.login({ username, password });
            const token = response.data.accessToken;
            await login(token);
        } catch (err) {
            setError("Не вдалося увійти. Перевірте логін та пароль.");
            console.error(err);
        }
    };

    if (user) {
        return null;
    }

    return (
        <div className="auth-container">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h2>VleApi Логін</h2>
                <div className="form-group">
                    <label htmlFor="username">Ім'я користувача</label>
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
                {error && <p className="error-message">{error}</p>}
                <button type="submit" className="btn-primary">
                    Увійти
                </button>
            </form>
        </div>
    );
};

export default LoginPage;