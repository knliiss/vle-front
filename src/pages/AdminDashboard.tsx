import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { User, Course, Group } from "../types";
import { adminApi } from "../api/apiService";
import CreateUserModal from "../components/CreateUserModal";
import CreateCourseModal from "../components/CreateCourseModal";
import CreateGroupModal from "../components/CreateGroupModal";

const AdminDashboard = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);

    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

    const loadData = async () => {
        try {
            const usersRes = await adminApi.getUsers(); setUsers(usersRes.data);
            const coursesRes = await adminApi.getCourses(); setCourses(coursesRes.data);
            const groupsRes = await adminApi.getGroups(); setGroups(groupsRes.data);
        } catch (error) { console.error("Failed to load admin data", error); }
    };

    useEffect(() => { loadData(); }, []);

    return (
        <>
            <CreateUserModal show={showCreateUserModal} onClose={() => setShowCreateUserModal(false)} onUserCreated={loadData} />
            <CreateCourseModal show={showCreateCourseModal} onClose={() => setShowCreateCourseModal(false)} onCourseCreated={loadData} />
            <CreateGroupModal show={showCreateGroupModal} onClose={() => setShowCreateGroupModal(false)} onGroupCreated={loadData} />

            <div className="dashboard-container">
                <header className="dashboard-header">
                    <h1>Адмін-панель</h1>
                </header>

                <div className="admin-actions">
                    <button onClick={() => setShowCreateUserModal(true)} className="btn-primary">Створити користувача</button>
                    <button onClick={() => setShowCreateCourseModal(true)} className="btn-primary">Створити курс</button>
                    <button onClick={() => setShowCreateGroupModal(true)} className="btn-primary">Створити групу</button>
                    <Link to="/admin/users" className="btn-secondary">Керування користувачами</Link>
                    <Link to="/admin/courses" className="btn-secondary">Керування курсами</Link>
                    <Link to="/admin/groups" className="btn-secondary">Керування групами</Link>
                </div>

                <main className="dashboard-content">
                    <div className="card" style={{marginBottom: '2rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
    <h3>Користувачі</h3>
    <ul style={{display: 'flex', flexDirection: 'column', gap: '1rem', margin: 0, padding: 0, listStyle: 'none'}}>
      {users.map(user => (
        <li key={user.id} style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem 0', borderBottom: '1px dashed var(--border)'}}>
          <span style={{fontWeight: 600, color: 'var(--text-main)'}}>{user.fio || user.username}</span>
          <span style={{fontSize: '0.95rem', color: 'var(--text-secondary)'}}>{user.role}</span>
          {(() => { const g = user.groupId ? groups.find(gr => gr.id === user.groupId) : null; return g ? <span style={{fontSize: '0.9rem', color: 'var(--primary)'}}>Група: {g.name}</span> : null; })()}
        </li>
      ))}
    </ul>
  </div>

                    <section className="card">
                        <h3>Курси</h3>
                        <ul>
                            {courses.slice(0,8).map((c) => (
                                <li key={c.id}>
                                    <Link to={`/course/${c.id}`}>{c.name}</Link>
                                </li>
                            ))}
                            {courses.length > 8 && <li><Link to="/admin/courses">Переглянути всі...</Link></li>}
                        </ul>
                    </section>

                    <section className="card">
                        <h3>Групи</h3>
                        <ul>
                            {groups.slice(0,8).map((g) => (
                                <li key={g.id}><Link to="/admin/groups">{g.name}</Link></li>
                            ))}
                            {groups.length > 8 && <li><Link to="/admin/groups">Переглянути всі...</Link></li>}
                        </ul>
                    </section>
                </main>
            </div>
        </>
    );
};

export default AdminDashboard;
