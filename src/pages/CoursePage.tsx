import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { commonApi, adminApi } from "../api/apiService";
import type { Topic } from "../types";
import TopicItem from "../components/TopicItem";
import Modal from "../components/Modal";
import { useToast } from "../components/ToastProvider";

const CoursePage = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const { user } = useAuth();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showTopicModal, setShowTopicModal] = useState(false);
    const [topicName, setTopicName] = useState("");
    const [topicDescription, setTopicDescription] = useState("");
    const { notify } = useToast();

    const fetchTopics = async () => {
        if (!courseId) return;
        setLoading(true);
        try {
            const res = await commonApi.getCourseTopics(Number(courseId));
            setTopics(res.data);
        } catch (err) {
            setError("Не вдалося завантажити теми курсу.");
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTopics();
    }, [courseId]);

    const handleAddTopic = async (e: FormEvent) => {
        e.preventDefault();
        if (!courseId || !topicName) return;

        try {
            await adminApi.createTopic({
                name: topicName,
                description: topicDescription,
                courseId: Number(courseId)
            });
            setShowTopicModal(false);
            setTopicName("");
            setTopicDescription("");
            fetchTopics(); // Оновлюємо список тем
        } catch (err) {
            console.error("Помилка створення теми", err);
            notify("Не вдалося створити тему", 'error');
        }
    };

    const canManageCourse = user?.role === "ADMINISTRATOR" || user?.role === "TEACHER";

    const getDashboardLink = () => {
        switch (user?.role) {
            case "ADMINISTRATOR": return "/admin";
            case "TEACHER": return "/teacher";
            case "STUDENT": return "/student";
            default: return "/";
        }
    }

    if (loading) return <div className="dashboard-container"><p>Завантаження...</p></div>;
    if (error) return <div className="dashboard-container"><p className="error-message">{error}</p></div>;

    return (
        <>
            <Modal title="Створити нову тему" show={showTopicModal} onClose={() => setShowTopicModal(false)}>
                <form onSubmit={handleAddTopic}>
                    <div className="form-group">
                        <label htmlFor="topicName">Назва теми</label>
                        <input
                            type="text"
                            id="topicName"
                            value={topicName}
                            onChange={(e) => setTopicName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="topicDescription">Опис (необов'язково)</label>
                        <input
                            type="text"
                            id="topicDescription"
                            value={topicDescription}
                            onChange={(e) => setTopicDescription(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn-primary">Створити</button>
                </form>
            </Modal>

            <div className="dashboard-container">
                <header className="dashboard-header">
                    <h1>Сторінка Курсу</h1>
                    <Link to={getDashboardLink()} className="btn-secondary" style={{width: 'auto'}}>
                        Назад до панелі
                    </Link>
                </header>

                {canManageCourse && (
                    <div className="admin-actions">
                        <button onClick={() => setShowTopicModal(true)} className="btn-primary" style={{width: 'auto'}}>Додати нову тему</button>
                    </div>
                )}

                <main>
                    <div className="topics-list">
                        {topics.length > 0 ? (
                            topics.map((topic) => (
                                <TopicItem
                                    key={topic.id}
                                    topic={topic}
                                    userRole={user!.role}
                                    onTaskCreated={fetchTopics}
                                />
                            ))
                        ) : (
                            <p>У цьому курсі ще немає тем.</p>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
};

export default CoursePage;