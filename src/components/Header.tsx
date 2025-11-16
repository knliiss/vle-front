import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
    const { user, logout } = useAuth();

    return (
        <header className="app-header">
            <Link to="/" className="app-logo">
                VleApi Платформа
            </Link>
            <div className="user-menu">
                <span className="text-muted">Вітаємо, {user?.username}</span>
                <button onClick={logout} className="btn btn-secondary btn-small">
                    Вийти
                </button>
            </div>
        </header>
    );
};

export default Header;