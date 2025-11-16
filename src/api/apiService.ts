import axios from "axios";
import type { User, Course, Group, Task, Topic, Submission } from "../types";

const apiClient = axios.create({
    baseURL: "http://localhost:8060/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authApi = {
    login: (data: object) => apiClient.post("/auth/login", data),
    getSelf: () => apiClient.get<User>("/users/me"),
};

export const adminApi = {
    getUsers: () => apiClient.get<User[]>("/users"),
    createUser: (data: object) => apiClient.post<User>("/users", data),
    getCourses: () => apiClient.get<Course[]>("/courses"),
    createCourse: (data: object) => apiClient.post<Course>("/courses", data),
    getGroups: () => apiClient.get<Group[]>("/groups"),
    createGroup: (data: object) => apiClient.post<Group>("/groups", data),
    bindUserToGroup: (userId: number, groupId: number) =>
        apiClient.post(`/admin/relations/user/${userId}/group/${groupId}`),
    bindTeacherToCourse: (teacherId: number, courseId: number) =>
        apiClient.post(`/admin/relations/teacher/${teacherId}/course/${courseId}`),
    bindCourseToGroup: (courseId: number, groupId: number) =>
        apiClient.post(`/admin/relations/course/${courseId}/group/${groupId}`),

    // ⭐️ НОВІ ФУНКЦІЇ
    createTopic: (data: { name: string; description?: string; courseId: number }) =>
        apiClient.post<Topic>("/topics", data),
    createTask: (data: { name: string; description?: string; topicId: number; maxMark?: number, dueDate?: string }) =>
        apiClient.post<Task>("/tasks", data),
};

export const commonApi = {
    getCourseTopics: (courseId: number) =>
        apiClient.get<Topic[]>(`/courses/${courseId}/topics`),
    getTopicTasks: (topicId: number) =>
        apiClient.get<Task[]>(`/topics/${topicId}/tasks`),
    getTaskById: (taskId: number) => apiClient.get<Task>(`/tasks/${taskId}`),
};

export const studentApi = {
    getMyCourses: (userId: number) =>
        apiClient.get<Course[]>(`/users/${userId}/courses`),

    getMyTestSubmissions: () =>
        apiClient.get<Submission[]>("/users/me/submissions/tests"),

    getMyFileSubmissions: () =>
        apiClient.get<Submission[]>("/users/me/submissions/files"),

    getMySubmissionsForTask: (taskId: number) =>
        apiClient.get<Submission[]>(`/tasks/${taskId}/submissions/me`),

    submitTestTask: (taskId: number, content: string) =>
        apiClient.post(`/tasks/${taskId}/submissions/test`, JSON.stringify(content), {
            headers: { "Content-Type": "application/json" },
        }),

    submitFileTask: (taskId: number, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiClient.post(`/tasks/${taskId}/submissions/file`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
};

export default apiClient;