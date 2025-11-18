import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from 'react';

interface HeaderProps {
    onToggleSidebar?: () => void;
}

const Header = ({ onToggleSidebar }: HeaderProps) => {
    const { user, logout } = useAuth();
    const [theme, setTheme] = useState<string>(() => localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

    return (
        <header className="app-header">
            <div className="flex gap-md" style={{alignItems:'center'}}>
                {onToggleSidebar && (
                    <button onClick={onToggleSidebar} className="btn-secondary btn-small" aria-label="Toggle sidebar">☰</button>
                )}
                <Link to="/" className="app-logo">
                    Vle Платформа
                </Link>
            </div>
            <div className="user-menu">
                <button onClick={toggleTheme} className="btn-primary theme-toggle-btn" aria-label="Toggle theme">
                    <span style={{marginRight:'0.5em'}}>{theme === 'dark' ? '🌙' : '🌞'}</span> Тема
                </button>
                <span>Вітаємо, {user?.fio || user?.username}</span>
                <button onClick={logout} className="btn-secondary btn-small" aria-label="Logout">
                    Вийти
                </button>
            </div>
        </header>
    );
};

export default Header;