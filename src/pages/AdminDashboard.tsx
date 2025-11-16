import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { User, Course, Group } from "../types";
import { adminApi } from "../api/apiService";
import CreateUserModal from "../components/CreateUserModal";
import BindUserToGroupModal from "../components/BindUserToGroupModal";
import CreateCourseModal from "../components/CreateCourseModal";
import CreateGroupModal from "../components/CreateGroupModal";
import BindTeacherToCourseModal from "../components/BindTeacherToCourseModal";
import BindGroupToCourseModal from "../components/BindGroupToCourseModal";

const AdminDashboard = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);

    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

    const [showBindGroupModal, setShowBindGroupModal] = useState(false);
    const [showBindTeacherModal, setShowBindTeacherModal] = useState(false);
    const [showBindGroupToCourseModal, setShowBindGroupToCourseModal] = useState(false);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const loadData = async () => {
        try {
            const usersRes = await adminApi.getUsers();
            setUsers(usersRes.data);
            const coursesRes = await adminApi.getCourses();
            setCourses(coursesRes.data);
            const groupsRes = await adminApi.getGroups();
            setGroups(groupsRes.data);
        } catch (error) {
            console.error("Failed to load admin data", error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openBindModal = (user: User) => {
        setSelectedUser(user);
        setShowBindGroupModal(true);
    };

    const closeBindModal = () => {
        setShowBindGroupModal(false);
        setSelectedUser(null);
        loadData();
    };

    return (
        <>
            <CreateUserModal
                show={showCreateUserModal}
                onClose={() => setShowCreateUserModal(false)}
                onUserCreated={loadData}
            />
            <CreateCourseModal
                show={showCreateCourseModal}
                onClose={() => setShowCreateCourseModal(false)}
                onCourseCreated={loadData}
            />
            <CreateGroupModal
                show={showCreateGroupModal}
                onClose={() => setShowCreateGroupModal(false)}
                onGroupCreated={loadData}
            />
            <BindUserToGroupModal
                show={showBindGroupModal}
                onClose={closeBindModal}
                user={selectedUser}
            />
            <BindTeacherToCourseModal
                show={showBindTeacherModal}
                onClose={() => setShowBindTeacherModal(false)}
                courses={courses}
                users={users}
            />
            <BindGroupToCourseModal
                show={showBindGroupToCourseModal}
                onClose={() => setShowBindGroupToCourseModal(false)}
                courses={courses}
                groups={groups}
            />

            <div className="dashboard-container">
                <header className="dashboard-header">
                    <h1>Панель адміністратора</h1>
                </header>

                <div className="admin-actions">
                    <button
                        onClick={() => setShowCreateUserModal(true)}
                        className="btn-primary"
                    >
                        Створити користувача
                    </button>
                    <button
                        onClick={() => setShowCreateCourseModal(true)}
                        className="btn-primary"
                    >
                        Створити курс
                    </button>
                    <button
                        onClick={() => setShowCreateGroupModal(true)}
                        className="btn-primary"
                    >
                        Створити групу
                    </button>
                </div>

                <div className="admin-actions">
                    <button
                        onClick={() => setShowBindTeacherModal(true)}
                        className="btn-secondary"
                    >
                        Призначити викладача
                    </button>
                    <button
                        onClick={() => setShowBindGroupToCourseModal(true)}
                        className="btn-secondary"
                    >
                        Додати групу до курсу
                    </button>
                </div>

                <main className="dashboard-content">
                    <section className="card">
                        <h3>Керування курсами</h3>
                        <ul>
                            {courses.map((c) => (
                                <li key={c.id}>
                                    <Link to={`/course/${c.id}`}>{c.name}</Link>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="card">
                        <h3>Керування користувачами</h3>
                        <ul className="user-list">
                            {users.map((u) => (
                                <li key={u.id} className="user-list-item">
                                    <div className="user-info">
                                        <strong>{u.username}</strong>
                                        <span className="user-role">{u.role}</span>
                                        {u.groupId && (
                                            <span className="user-group">
                        Група: {groups.find(g => g.id === u.groupId)?.name || u.groupId}
                      </span>
                                        )}
                                    </div>
                                    <div className="user-actions">
                                        <button onClick={() => openBindModal(u)} className="btn-secondary btn-small">
                                            Група
                                        </button>
                                        <button className="btn-danger btn-small">Видалити</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="card">
                        <h3>Керування групами</h3>
                        <ul>
                            {groups.map((g) => (
                                <li key={g.id}>{g.name}</li>
                            ))}
                        </ul>
                    </section>
                </main>
            </div>
        </>
    );
};

export default AdminDashboard;