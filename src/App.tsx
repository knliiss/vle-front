import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {AuthProvider, useAuth} from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import DevOverlayGuard from "./components/DevOverlayGuard";

import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import NotFoundPage from "./pages/NotFoundPage";
import CoursePage from "./pages/CoursePage";
import TaskPage from "./pages/TaskPage";
import AdminGroupsPage from "./pages/AdminGroupsPage";
import AdminCoursesPage from "./pages/AdminCoursesPage";
import AdminUsersPage from "./pages/AdminUsersPage";

import "./styles/main.css";

const App = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <DevOverlayGuard />
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route element={<Layout />}>
                        <Route
                            element={
                                <ProtectedRoute allowedRoles={["ADMINISTRATOR"]} />
                            }
                        >
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route path="/admin/groups" element={<AdminGroupsPage />} />
                            <Route path="/admin/courses" element={<AdminCoursesPage />} />
                            <Route path="/admin/users" element={<AdminUsersPage />} />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute allowedRoles={["TEACHER"]} />
                            }
                        >
                            <Route path="/teacher" element={<TeacherDashboard />} />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute allowedRoles={["STUDENT"]} />
                            }
                        >
                            <Route path="/student" element={<StudentDashboard />} />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute allowedRoles={["ADMINISTRATOR", "TEACHER", "STUDENT"]} />
                            }
                        >
                            <Route path="/course/:courseId" element={<CoursePage />} />
                            <Route path="/task/:taskId" element={<TaskPage />} />
                        </Route>
                    </Route>

                    <Route path="/" element={<RootRedirect />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
};

const RootRedirect = () => {
    const { user } = useAuth();

    if (user) {
        switch (user.role) {
            case "ADMINISTRATOR": return <Navigate to="/admin" replace />;
            case "TEACHER": return <Navigate to="/teacher" replace />;
            case "STUDENT": return <Navigate to="/student" replace />;
        }
    }
    return <Navigate to="/login" replace />;
};

export default App;