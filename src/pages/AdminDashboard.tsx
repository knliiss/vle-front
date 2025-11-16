import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { User, Course, Group } from "../types";
import { adminApi } from "../api/apiService";
import localStore from "../api/localStore";
import UserForm from "../components/UserForm";
import CourseForm from "../components/CourseForm";
import ConfirmDialog from "../components/ConfirmDialog";

const AdminDashboard = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);

    const [userModalOpen, setUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const [courseModalOpen, setCourseModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDelete, setToDelete] = useState<{ type: "user" | "course"; id: number } | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const usersRes = await adminApi.getUsers();
                setUsers(usersRes.data);
                const coursesRes = await adminApi.getCourses();
                setCourses(coursesRes.data);
                const groupsRes = await adminApi.getGroups();
                setGroups(groupsRes.data);
            } catch (error) {
                console.error("Failed to load admin data, falling back to local store", error);
                // fallback to localStore
                const usersRes = await localStore.getUsers();
                setUsers(usersRes.data);
                const coursesRes = await localStore.getCourses();
                setCourses(coursesRes.data);
                const groupsRes = await localStore.getGroups();
                setGroups(groupsRes.data);
            }
        };
        loadData();
    }, []);

    const handleCreateUser = () => {
        setEditingUser(null);
        setUserModalOpen(true);
    };

    const handleEditUser = (u: User) => {
        setEditingUser(u);
        setUserModalOpen(true);
    };

    const handleSaveUser = async (user: User) => {
        try {
            if ((user as any).id && users.find((x) => x.id === user.id)) {
                // update
                await adminApi.updateUser(user.id, user).then((res) => {
                    setUsers((prev) => prev.map((p) => (p.id === user.id ? res.data : p)));
                }).catch(async () => {
                    const res = await localStore.updateUser(user.id, user);
                    setUsers((prev) => prev.map((p) => (p.id === user.id ? res.data : p)));
                });
            } else {
                // create
                await adminApi.createUser(user).then((res) => {
                    setUsers((prev) => [...prev, res.data]);
                }).catch(async () => {
                    const res = await localStore.createUser(user);
                    setUsers((prev) => [...prev, res.data]);
                });
            }
        } catch (err) {
            console.error("save user failed", err);
        }
    };

    const handleDeleteUser = async (id: number) => {
        try {
            await adminApi.deleteUser(id).then(() => {
                setUsers((prev) => prev.filter((u) => u.id !== id));
            }).catch(async () => {
                await localStore.deleteUser(id);
                setUsers((prev) => prev.filter((u) => u.id !== id));
            });
        } catch (err) {
            console.error("delete user failed", err);
        }
    };

    const handleCreateCourse = () => {
        setEditingCourse(null);
        setCourseModalOpen(true);
    };

    const handleEditCourse = (c: Course) => {
        setEditingCourse(c);
        setCourseModalOpen(true);
    };

    const handleSaveCourse = async (course: Course) => {
        try {
            if (courses.find((x) => x.id === course.id)) {
                await adminApi.updateCourse(course.id, course).then((res) => {
                    setCourses((prev) => prev.map((p) => (p.id === course.id ? res.data : p)));
                }).catch(async () => {
                    const res = await localStore.updateCourse(course.id, course);
                    setCourses((prev) => prev.map((p) => (p.id === course.id ? res.data : p)));
                });
            } else {
                await adminApi.createCourse(course).then((res) => {
                    setCourses((prev) => [...prev, res.data]);
                }).catch(async () => {
                    const res = await localStore.createCourse(course);
                    setCourses((prev) => [...prev, res.data]);
                });
            }
        } catch (err) {
            console.error("save course failed", err);
        }
    };

    const handleDeleteCourse = async (id: number) => {
        try {
            await adminApi.deleteCourse(id).then(() => {
                setCourses((prev) => prev.filter((c) => c.id !== id));
            }).catch(async () => {
                await localStore.deleteCourse(id);
                setCourses((prev) => prev.filter((c) => c.id !== id));
            });
        } catch (err) {
            console.error("delete course failed", err);
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Панель адміністратора</h1>
            </header>

            <main className="dashboard-content">
                <section className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3>Керування курсами</h3>
                        <div>
                            <button className="btn btn-primary" onClick={handleCreateCourse}>Додати курс</button>
                        </div>
                    </div>
                    <ul>
                        {courses.map((c) => (
                            <li key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Link to={`/course/${c.id}`}>{c.name}</Link>
                                <div>
                                    <button className="btn btn-secondary btn-small" onClick={() => handleEditCourse(c)}>Edit</button>
                                    <button className="btn btn-danger btn-small" onClick={() => { setToDelete({ type: "course", id: c.id }); setConfirmOpen(true); }}>Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3>Керування користувачами</h3>
                        <div>
                            <button className="btn btn-primary" onClick={handleCreateUser}>Додати користувача</button>
                        </div>
                    </div>
                    <ul>
                        {users.map((u) => (
                            <li key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span>{u.username} ({u.role})</span>
                                <div>
                                    <button className="btn btn-secondary btn-small" onClick={() => handleEditUser(u)}>Edit</button>
                                    <button className="btn btn-danger btn-small" onClick={() => { setToDelete({ type: "user", id: u.id }); setConfirmOpen(true); }}>Delete</button>
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

            <UserForm open={userModalOpen} initial={editingUser} onClose={() => setUserModalOpen(false)} onSaved={handleSaveUser} />
            <CourseForm open={courseModalOpen} initial={editingCourse} onClose={() => setCourseModalOpen(false)} onSaved={handleSaveCourse} />

            <ConfirmDialog open={confirmOpen} title="Підтвердіть видалення" message="Ви впевнені?" onCancel={() => { setConfirmOpen(false); setToDelete(null); }} onConfirm={async () => {
                if (!toDelete) return;
                if (toDelete.type === "user") await handleDeleteUser(toDelete.id);
                if (toDelete.type === "course") await handleDeleteCourse(toDelete.id);
                setConfirmOpen(false);
                setToDelete(null);
            }} />
        </div>
    );
};

export default AdminDashboard;