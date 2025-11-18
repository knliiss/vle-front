import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { teacherApi } from "../api/apiService";
import type { Course } from "../types";

const TeacherDashboard = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        teacherApi.getMyCourses(user.id)
            .then(res => setCourses(res.data))
            .catch(err => {
                console.error("Failed to load teacher courses", err);
                setError("Не вдалося завантажити курси.");
            })
            .finally(() => setLoading(false));
    }, [user]);

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Панель викладача</h1>
            </header>
            <main className="dashboard-content">
                <section className="card">
                    <h3>Мої курси</h3>
                    {loading && <p>Завантаження...</p>}
                    {error && <p className="error-message">{error}</p>}
                    {!loading && courses.length > 0 ? (
                        <ul>
                            {courses.map(c => <li key={c.id}>{c.name}</li>)}
                        </ul>
                    ) : (!loading && !error) && <p>Ще немає курсів.</p>}
                </section>
                <section className="card">
                    <h3>Роботи для перевірки</h3>
                    <p>Роботи, що очікують на перевірку, з'являться тут.</p>
                </section>
            </main>
        </div>
    );
};

export default TeacherDashboard;