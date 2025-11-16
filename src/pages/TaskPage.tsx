import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { commonApi, studentApi } from "../api/apiService";
import type { Task, Submission } from "../types";

const TaskPage = () => {
    const { taskId } = useParams<{ taskId: string }>();
    const { user } = useAuth();
    const [task, setTask] = useState<Task | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchTask = async () => {
            if (!taskId) return;
            setLoading(true);
            try {
                const taskRes = await commonApi.getTaskById(Number(taskId));
                setTask(taskRes.data);

                if (user?.role === "STUDENT") {
                    const subRes = await studentApi.getMySubmissionsForTask(
                        Number(taskId)
                    );
                    setSubmissions(subRes.data);
                } else {
                    // TODO: Логіка для вчителя/адміна (завантажити ВСІ роботи)
                }
            } catch (err) {
                setError("Не вдалося завантажити завдання.");
                console.error(err);
            }
            setLoading(false);
        };
        fetchTask();
    }, [taskId, user]);

    if (loading)
        return (
            <div className="dashboard-container">
                <p>Завантаження...</p>
            </div>
        );
    if (error)
        return (
            <div className="dashboard-container">
                <p className="error-message">{error}</p>
            </div>
        );
    if (!task)
        return (
            <div className="dashboard-container">
                <p>Завдання не знайдено.</p>
            </div>
        );

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Завдання: {task.name}</h1>
                <Link
                    to={`/course/${task.topicId}`}
                    className="btn-secondary"
                    style={{ width: "auto" }}
                >
                    Назад до курсу
                </Link>
            </header>

            <main className="dashboard-content" style={{ display: "block" }}>
                <section className="card">
                    <h3>Опис завдання</h3>
                    <p>{task.description || "Немає опису."}</p>
                    <p>
                        <strong>Макс. бал:</strong> {task.maxMark || "N/A"}
                    </p>
                    <p>
                        <strong>Термін здачі:</strong>{" "}
                        {task.dueDate
                            ? new Date(task.dueDate).toLocaleString("uk-UA")
                            : "N/A"}
                    </p>
                </section>

                {user?.role === "STUDENT" && (
                    <section className="card">
                        <h3>Здати роботу</h3>
                        <p>Тут буде форма для відправки файлу або тексту.</p>
                    </section>
                )}

                {user?.role !== "STUDENT" && (
                    <section className="card">
                        <h3>Роботи студентів</h3>
                        <p>Тут буде список робіт для перевірки.</p>
                        {/* ⭐️⭐️⭐️ ВИПРАВЛЕННЯ БУЛО ТУТ ⭐️⭐️⭐️
              </Section> було змінено на </section>
            */}
                    </section>
                )}

                {user?.role === "STUDENT" && (
                    <section className="card">
                        <h3>Мої роботи</h3>
                        {submissions.length > 0 ? (
                            <ul>
                                {submissions.map((sub, index) => (
                                    <li key={`${sub.id}-${index}`}>
                                        {new Date(sub.submitted).toLocaleString("uk-UA")} -
                                        <strong>{sub.status}</strong> - Оцінка:{" "}
                                        {sub.grade !== null && sub.grade !== undefined
                                            ? sub.grade
                                            : "Немає"}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>Ви ще не здавали це завдання.</p>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
};

export default TaskPage;