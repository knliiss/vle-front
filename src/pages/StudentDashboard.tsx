import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { studentApi } from "../api/apiService";
import type { Submission } from "../types";

const StudentDashboard = () => {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user) {
            setLoading(true);
            Promise.all([
                studentApi.getMyTestSubmissions(),
                studentApi.getMyFileSubmissions(),
            ])
                .then(([testRes, fileRes]) => {
                    const allSubmissions = [...testRes.data, ...fileRes.data];
                    allSubmissions.sort((a, b) => new Date(b.submitted).getTime() - new Date(a.submitted).getTime());
                    setSubmissions(allSubmissions);
                })
                .catch((err) => {
                    console.error("Failed to fetch submissions", err);
                    setError("Не вдалося завантажити ваші роботи.");
                })
                .finally(() => setLoading(false));
        }
    }, [user]);

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Панель студента</h1>
            </header>
            <main className="dashboard-content">
                <section className="card">
                    <h3>Мої останні роботи</h3>
                    {loading && <p>Завантаження...</p>}
                    {error && <p className="error-message">{error}</p>}
                    {!loading && submissions.length > 0 ? (
                        <ul>
                            {submissions.slice(0, 10).map((sub, index) => (
                                <li key={`${sub.id}-${index}`}>
                                    <Link to={`/task/${sub.taskId}`}>Завдання {sub.taskId}</Link>
                                    <span> - {new Date(sub.submitted).toLocaleString('uk-UA')} - </span>
                                    <strong>{sub.status}</strong>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        !loading && <p>Ви ще не здавали жодної роботи.</p>
                    )}
                </section>
            </main>
        </div>
    );
};

export default StudentDashboard;