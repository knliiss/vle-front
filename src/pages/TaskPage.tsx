import { useState, useEffect } from "react";
import type { FormEvent, ChangeEvent } from "react";
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

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchTaskAndSubmissions = async () => {
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
            }
        } catch (err) {
            setError("Не вдалося завантажити завдання.");
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTaskAndSubmissions();
    }, [taskId, user]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleFileSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !taskId) {
            alert("Будь ласка, виберіть файл");
            return;
        }
        setSubmitting(true);
        try {
            await studentApi.submitFileTask(Number(taskId), selectedFile);
            alert("Роботу успішно відправлено!");
            setSelectedFile(null);
            fetchTaskAndSubmissions(); // Оновлюємо список робіт
        } catch (err) {
            console.error("Помилка відправки файлу", err);
            alert("Не вдалося відправити файл");
        }
        setSubmitting(false);
    };


    if (loading) return <div className="dashboard-container"><p>Завантаження...</p></div>;
    if (error) return <div className="dashboard-container"><p className="error-message">{error}</p></div>;
    if (!task) return <div className="dashboard-container"><p>Завдання не знайдено.</p></div>;

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Завдання: {task.name}</h1>
                <Link
                    to={`/course/${task.topicId}`} // Припускаємо, що topicId є в Task
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
                        <h3>Здати роботу (Файл)</h3>
                        <form onSubmit={handleFileSubmit}>
                            <div className="form-group">
                                <label htmlFor="file-upload">Виберіть файл</label>
                                <input
                                    type="file"
                                    id="file-upload"
                                    onChange={handleFileChange}
                                    style={{width: '100%'}}
                                />
                            </div>
                            <button type="submit" className="btn-primary" style={{width: '100%'}} disabled={submitting || !selectedFile}>
                                {submitting ? "Відправка..." : "Відправити"}
                            </button>
                        </form>
                    </section>
                )}

                {user?.role !== "STUDENT" && (
                    <section className="card">
                        <h3>Роботи студентів</h3>
                        <p>Тут буде список робіт для перевірки.</p>
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