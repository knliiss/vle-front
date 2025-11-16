import { Link } from "react-router-dom";

const NotFoundPage = () => {
    return (
        <div className="auth-container">
            <div style={{ textAlign: "center" }}>
                <h1 style={{ fontSize: "5rem", margin: 0 }}>404</h1>
                <p style={{ fontSize: "1.5rem" }}>Сторінку не знайдено</p>
                <Link to="/" className="btn-secondary">
                    На головну
                </Link>
            </div>
        </div>
    );
};

export default NotFoundPage;