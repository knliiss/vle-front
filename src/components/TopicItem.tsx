import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { commonApi } from "../api/apiService";
import type { Task, Topic, UserRole } from "../types";

interface TopicItemProps {
    topic: Topic;
    userRole: UserRole;
}

const TopicItem = ({ topic, userRole }: TopicItemProps) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchTasks = async () => {
            setLoading(true);
            try {
                const res = await commonApi.getTopicTasks(topic.id);
                setTasks(res.data);
            } catch (err) {
                console.error("Failed to fetch tasks", err);
            }
            setLoading(false);
        };
        fetchTasks();
    }, [topic.id]);

    const canManage = userRole === "ADMINISTRATOR" || userRole === "TEACHER";

    return (
        <section className="card topic-card">
            <div className="topic-header">
                <h3>{topic.name}</h3>
                {canManage && <button className="btn-secondary btn-small">Редагувати</button>}
            </div>
            <p>{topic.description || "Немає опису"}</p>

            <h4>Завдання:</h4>
            {loading && <p>Завантаження завдань...</p>}

            {!loading && tasks.length > 0 ? (
                <ul className="task-list">
                    {tasks.map((task) => (
                        <li key={task.id}>
                            <Link to={`/task/${task.id}`}>{task.name}</Link>
                        </li>
                    ))}
                </ul>
            ) : (
                !loading && <p>До цієї теми ще не додано завдань.</p>
            )}

            {canManage && (
                <button className="btn-primary btn-small" style={{ marginTop: '1rem', width: 'auto' }}>
                    Додати завдання
                </button>
            )}
        </section>
    );
};

export default TopicItem;