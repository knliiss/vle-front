import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { commonApi } from "../api/apiService";
import type { Topic } from "../types";
import TopicItem from "../components/TopicItem";
import TopicForm from "../components/TopicForm";
import localStore from "../api/localStore";

const CoursePage = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const { user } = useAuth();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [topicModalOpen, setTopicModalOpen] = useState(false);

    useEffect(() => {
        const fetchTopics = async () => {
            if (!courseId) return;
            setLoading(true);
            try {
                const res = await commonApi.getCourseTopics(Number(courseId));
                setTopics(res.data);
            } catch (err) {
                setError("Не вдалося завантажити теми курсу.");
                console.error(err);
                const res = await localStore.getCourseTopics(Number(courseId));
                setTopics(res.data);
            }
            setLoading(false);
        };
        fetchTopics();
    }, [courseId]);

    const canManageCourse = user?.role === "ADMINISTRATOR" || user?.role === "TEACHER";

    const getDashboardLink = () => {
        switch (user?.role) {
            case "ADMINISTRATOR": return "/admin";
            case "TEACHER": return "/teacher";
            case "STUDENT": return "/student";
            default: return "/";
        }
    }

    const handleCreateTopicSaved = async (topic: Topic) => {
        try {
            await commonApi.createTopic(Number(courseId), topic).then((res) => {
                setTopics((prev) => [...prev, res.data]);
            }).catch(async () => {
                const res = await localStore.createTopic(Number(courseId), topic);
                setTopics((prev) => [...prev, res.data]);
            });
        } catch (err) {
            console.error("failed to create topic", err);
        }
    };

    if (loading) return <div className="dashboard-container"><p>Завантаження...</p></div>;
    if (error) return <div className="dashboard-container"><p className="error-message">{error}</p></div>;

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Сторінка Курсу</h1>
                <Link to={getDashboardLink()} className="btn-secondary btn" style={{width: 'auto'}}>
                    Назад до панелі
                </Link>
            </header>

            {canManageCourse && (
                <div className="admin-actions">
                    <button className="btn btn-primary" style={{width: 'auto'}} onClick={() => setTopicModalOpen(true)}>Додати нову тему</button>
                </div>
            )}

            <main>
                <div className="topics-list">
                    {topics.length > 0 ? (
                        topics.map((topic) => (
                            <TopicItem key={topic.id} topic={topic} userRole={user!.role} />
                        ))
                    ) : (
                        <p>У цьому курсі ще немає тем.</p>
                    )}
                </div>
            </main>

            <TopicForm open={topicModalOpen} onClose={() => setTopicModalOpen(false)} onSaved={handleCreateTopicSaved} courseId={Number(courseId)} />
        </div>
    );
};

export default CoursePage;