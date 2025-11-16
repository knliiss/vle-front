import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { commonApi, adminApi } from "../api/apiService";
import type { Task, Topic, UserRole } from "../types";
import Modal from "./Modal";

interface TopicItemProps {
    topic: Topic;
    userRole: UserRole;
    onTaskCreated: () => void; // Функція, щоб оновити список
}

const TopicItem = ({ topic, userRole, onTaskCreated }: TopicItemProps) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);

    const [showTaskModal, setShowTaskModal] = useState(false);
    const [taskName, setTaskName] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [taskMaxMark, setTaskMaxMark] = useState(100);

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

    useEffect(() => {
        fetchTasks();
    }, [topic.id]);

    const handleAddTask = async (e: FormEvent) => {
        e.preventDefault();
        if (!taskName) return;

        try {
            await adminApi.createTask({
                name: taskName,
                description: taskDescription,
                topicId: topic.id,
                maxMark: taskMaxMark
            });
            setShowTaskModal(false);
            setTaskName("");
            setTaskDescription("");
            setTaskMaxMark(100);
            onTaskCreated(); // Викликаємо оновлення
        } catch (err) {
            console.error("Помилка створення завдання", err);
            alert("Не вдалося створити завдання");
        }
    };

    const canManage = userRole === "ADMINISTRATOR" || userRole === "TEACHER";

    return (
        <>
            <Modal title="Створити нове завдання" show={showTaskModal} onClose={() => setShowTaskModal(false)}>
                <form onSubmit={handleAddTask}>
                    <div className="form-group">
                        <label htmlFor="taskName">Назва завдання</label>
                        <input
                            type="text"
                            id="taskName"
                            value={taskName}
                            onChange={(e) => setTaskName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="taskDescription">Опис</label>
                        <input
                            type="text"
                            id="taskDescription"
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="taskMaxMark">Макс. бал</label>
                        <input
                            type="number"
                            id="taskMaxMark"
                            value={taskMaxMark}
                            onChange={(e) => setTaskMaxMark(Number(e.target.value))}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary">Створити</button>
                </form>
            </Modal>

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
                    <button onClick={() => setShowTaskModal(true)} className="btn-primary btn-small" style={{ marginTop: '1rem', width: 'auto' }}>
                        Додати завдання
                    </button>
                )}
            </section>
        </>
    );
};

export default TopicItem;