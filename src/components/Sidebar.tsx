import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { studentApi, adminApi } from "../api/apiService";
import type { Course } from "../types";

const Sidebar = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        let coursesPromise;

        if (user.role === "STUDENT") {
            coursesPromise = studentApi.getMyCourses(user.id);
        } else if (user.role === "ADMINISTRATOR") {
            coursesPromise = adminApi.getCourses();
        } else {
            // TODO: Потрібен 'teacherApi.getMyCourses()'
            coursesPromise = Promise.resolve({ data: [] });
        }

        coursesPromise
            .then((res) => setCourses(res.data))
            .catch((err) => console.error("Не вдалося завантажити курси", err))
            .finally(() => setLoading(false));

    }, [user]);

    const getDashboardLink = () => {
        switch (user?.role) {
            case "ADMINISTRATOR": return "/admin";
            case "TEACHER": return "/teacher";
            case "STUDENT": return "/student";
            default: return "/";
        }
    }

    return (
        <aside className="sidebar">
            <nav>
                <ul>
                    <li>
                        <NavLink to={getDashboardLink()}>
                            Панель приладів
                        </NavLink>
                    </li>
                </ul>
                <hr />
                <h5>Мої курси</h5>
                {loading && <p>Завантаження...</p>}
                <ul>
                    {courses.map((course) => (
                        <li key={course.id}>
                            <NavLink to={`/course/${course.id}`}>
                                {course.name}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;