import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { teacherApi, submissionsApi } from "../api/apiService";
import { Link } from "react-router-dom";
import type { Course } from "../types";
import type { CombinedSubmission } from "../types";

const TeacherDashboard = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [recentSubs, setRecentSubs] = useState<CombinedSubmission[]>([]);
    const [recentLoading, setRecentLoading] = useState(false);
    const [recentError, setRecentError] = useState("");

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

    useEffect(() => {
        const loadRecent = async () => {
            if (!user) return;
            if (user.role !== 'TEACHER' && user.role !== 'ADMINISTRATOR') return;
            setRecentLoading(true);
            setRecentError("");
            try {
                const res = await teacherApi.getRecentSubmissions(user.id, 50);
                setRecentSubs(Array.isArray(res.data) ? res.data : []);
            } catch (e) {
                console.error('Failed to load recent submissions', e);
                setRecentError('Не вдалося завантажити останні роботи');
            } finally { setRecentLoading(false); }
        };
        loadRecent();
    }, [user]);

    const handleDownload = async (submissionId: string, fileName?: string | null) => {
        try {
            const res = await submissionsApi.downloadFile(submissionId);
            const blob = res.data;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName || 'submission';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Download failed', e);
            alert('Не вдалося завантажити файл');
        }
    };

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
                    <h3>Останні роботи</h3>
                    {recentLoading && <p>Завантаження...</p>}
                    {recentError && <p className="error-message">{recentError}</p>}
                    {!recentLoading && recentSubs.length === 0 && <p>Немає нових робіт.</p>}
                    {!recentLoading && recentSubs.length > 0 && (
                        <ul style={{listStyle:'none', padding:0, margin:0}}>
                            {recentSubs.map(s => (
                                <li key={s.id} style={{borderBottom:'1px solid var(--border)', padding:'0.5rem 0', display:'flex', justifyContent:'space-between', gap:12}}>
                                    <div>
                                        <div style={{fontSize:'0.95rem'}}><strong>User #{s.userId}</strong> • Task #{s.taskId} <Link to={`/task/${s.taskId}`} className="link-small">(open)</Link></div>
                                        <div style={{fontSize:'0.8rem', color:'var(--text-secondary)'}}>{new Date(s.submitted).toLocaleString('uk-UA')} — {s.status} — Оцінка: {s.grade ?? '—'}</div>
                                    </div>
                                    <div style={{display:'flex', gap:8, alignItems:'center'}}>
                                        {s.contentUrl && <button className="btn-secondary btn-small" onClick={()=>handleDownload(s.id, s.fileName)}>Завантажити</button>}
                                        <Link to={`/task/${s.taskId}?student=${s.userId}`} className="btn-secondary btn-small">Перейти до завдання</Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
             </main>
         </div>
     );
 };

 export default TeacherDashboard;
