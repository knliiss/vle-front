import axios from "axios";
// Передбачається, що типи імпортуються з вашого файлу types.ts
// Якщо якихось типів не вистачає, замініть їх на 'any' або додайте в types.ts
import type {
    User, UserExtended, UserCreateRequest, UserUpdateRequest,
    Course, CourseDto,
    Group, GroupDto,
    Topic, TopicDto,
    Task, TaskDto,
    Submission, TestSubmitRequest,
    TeacherProfileUpdateRequest, StudentProfileUpdateRequest, AdminProfileUpdateRequest,
    CourseCreateRequest, GroupCreateRequest, TopicCreateRequest, TaskCreateRequest,
    TestQuestion, TestQuestionCreate, TestQuestionUpdate
} from "../types";

// --- НАЛАШТУВАННЯ AXIOS ---

const apiClient = axios.create({
    baseURL: "http://localhost:8060/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
});

// Інтерцептор для додавання токена до кожного запиту
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- API METODS ---

export const authApi = {
    /** * POST /auth/login
     * Автентифікація користувача. Повертає JWT токен.
     */
    login: (data: { username: string; password: string }) =>
        apiClient.post("/auth/login", data),

    /** * POST /auth/register
     * Реєстрація нового користувача.
     * Header 'X-Bootstrap-Secret' потрібен для створення першого адміна.
     */
    register: (data: UserCreateRequest, bootstrapSecret?: string) =>
        apiClient.post("/auth/register", data, {
            headers: bootstrapSecret ? { "X-Bootstrap-Secret": bootstrapSecret } : {}
        }),

    /** * POST /auth/refresh
     * Оновлення токена доступу за допомогою refresh token.
     */
    refresh: (data: { token: string }) =>
        apiClient.post("/auth/refresh", data),

    /** * POST /auth/logout
     * Вихід із системи (відкликання refresh token).
     */
    logout: (data: { token: string }) =>
        apiClient.post("/auth/logout", data),
};

export const usersApi = {
    /** GET /users - Отримати список усіх користувачів */
    getAll: () => apiClient.get<User[]>("/users"),

    /** POST /users - Створити користувача (Admin) */
    create: (data: UserCreateRequest) => apiClient.post<User>("/users", data),

    /** GET /users/{id} - Отримати користувача за ID */
    getById: (id: number) => apiClient.get<User>(`/users/${id}`),

    /** PUT /users/{id} - Повне оновлення користувача */
    update: (id: number, data: UserUpdateRequest) => apiClient.put<User>(`/users/${id}`, data),

    /** PATCH /users/{id} - Часткове оновлення користувача */
    patch: (id: number, data: UserUpdateRequest) => apiClient.patch<User>(`/users/${id}`, data),

    /** DELETE /users/{id} - Видалити користувача */
    delete: (id: number) => apiClient.delete(`/users/${id}`),

    /** GET /users/{id}/extended - Отримати розширену інформацію про користувача */
    getExtendedById: (id: number) => apiClient.get<UserExtended>(`/users/${id}/extended`),

    /** GET /users/{id}/courses - Отримати курси, доступні користувачу */
    getCourses: (id: number) => apiClient.get<CourseDto[]>(`/users/${id}/courses`),

    /** GET /users/me - Отримати профіль поточного користувача (Extended) */
    getMe: () => apiClient.get<UserExtended>("/users/me"),
};

export const profilesApi = {
    // --- Teacher Profile ---
    /** GET /profiles/teacher/me */
    getMyTeacherProfile: () => apiClient.get<UserExtended>("/profiles/teacher/me"),

    /** PUT /profiles/teacher/{userId} - Замінити профіль викладача */
    updateTeacherProfile: (userId: number, data: TeacherProfileUpdateRequest) =>
        apiClient.put(`/profiles/teacher/${userId}`, data),

    /** PATCH /profiles/teacher/{userId} - Оновити поля профілю викладача */
    patchTeacherProfile: (userId: number, data: TeacherProfileUpdateRequest) =>
        apiClient.patch(`/profiles/teacher/${userId}`, data),

    /** PATCH /profiles/teacher/{userId}/academicTitle - Оновити вчене звання */
    updateAcademicTitle: (userId: number, academicTitle: string) =>
        apiClient.patch(`/profiles/teacher/${userId}/academicTitle`, { academicTitle }),

    // --- Student Profile ---
    /** GET /profiles/student/me */
    getMyStudentProfile: () => apiClient.get<UserExtended>("/profiles/student/me"),

    /** PUT /profiles/student/{userId} - Замінити профіль студента */
    updateStudentProfile: (userId: number, data: StudentProfileUpdateRequest) =>
        apiClient.put(`/profiles/student/${userId}`, data),

    /** PATCH /profiles/student/{userId} - Оновити профіль студента */
    patchStudentProfile: (userId: number, data: StudentProfileUpdateRequest) =>
        apiClient.patch(`/profiles/student/${userId}`, data),

    /** PATCH /profiles/student/{userId}/group - Призначити/змінити групу студента */
    updateStudentGroup: (userId: number, groupId: number) =>
        apiClient.patch(`/profiles/student/${userId}/group`, { groupId }),

    // --- Admin Profile ---
    /** GET /profiles/admin/me */
    getMyAdminProfile: () => apiClient.get<UserExtended>("/profiles/admin/me"),

    /** PUT /profiles/admin/{userId} */
    updateAdminProfile: (userId: number, data: AdminProfileUpdateRequest) =>
        apiClient.put(`/profiles/admin/${userId}`, data),

    /** PATCH /profiles/admin/{userId}/profile */
    patchAdminProfile: (userId: number, data: AdminProfileUpdateRequest) =>
        apiClient.patch(`/profiles/admin/${userId}/profile`, data),

    /** PATCH /profiles/admin/{userId}/department */
    updateAdminDepartment: (userId: number, department: string) =>
        apiClient.patch(`/profiles/admin/${userId}/department`, { department }),
};

export const groupsApi = {
    /** GET /groups - Список груп */
    getAll: () => apiClient.get<Group[]>("/groups"),

    /** POST /groups - Створити групу */
    create: (data: GroupCreateRequest) => apiClient.post<Group>("/groups", data),

    /** GET /groups/{id} */
    getById: (id: number) => apiClient.get<Group>(`/groups/${id}`),

    /** PUT /groups/{id} */
    update: (id: number, data: GroupDto) => apiClient.put<Group>(`/groups/${id}`, data),

    /** PATCH /groups/{id} */
    patch: (id: number, data: GroupDto) => apiClient.patch<Group>(`/groups/${id}`, data),

    /** DELETE /groups/{id} */
    delete: (id: number) => apiClient.delete(`/groups/${id}`),
};

export const coursesApi = {
    /** GET /courses - Список курсів */
    getAll: () => apiClient.get<Course[]>("/courses"),

    /** POST /courses - Створити курс */
    create: (data: CourseCreateRequest) => apiClient.post<Course>("/courses", data),

    /** GET /courses/{id} */
    getById: (id: number) => apiClient.get<Course>(`/courses/${id}`),

    /** PUT /courses/{id} */
    update: (id: number, data: CourseDto) => apiClient.put<Course>(`/courses/${id}`, data),

    /** PATCH /courses/{id} */
    patch: (id: number, data: CourseDto) => apiClient.patch<Course>(`/courses/${id}`, data),

    /** DELETE /courses/{id} */
    delete: (id: number) => apiClient.delete(`/courses/${id}`),

    /** GET /courses/{id}/topics - Список тем курсу */
    getTopics: (id: number) => apiClient.get<Topic[]>(`/courses/${id}/topics`),
};

export const topicsApi = {
    /** GET /topics - Всі теми */
    getAll: () => apiClient.get<Topic[]>("/topics"),

    /** POST /topics - Створити тему */
    create: (data: TopicCreateRequest) => apiClient.post<Topic>("/topics", data),

    /** GET /topics/{id} */
    getById: (id: number) => apiClient.get<Topic>(`/topics/${id}`),

    /** PUT /topics/{id} */
    update: (id: number, data: TopicDto) => apiClient.put<Topic>(`/topics/${id}`, data),

    /** PATCH /topics/{id} */
    patch: (id: number, data: TopicDto) => apiClient.patch<Topic>(`/topics/${id}`, data),

    /** DELETE /topics/{id} */
    delete: (id: number) => apiClient.delete(`/topics/${id}`),

    /** GET /topics/{id}/tasks - Завдання теми */
    getTasks: (id: number) => apiClient.get<Task[]>(`/topics/${id}/tasks`),
};

export const tasksApi = {
    /** GET /tasks - Всі завдання */
    getAll: () => apiClient.get<Task[]>("/tasks"),

    /** POST /tasks - Створити завдання */
    create: (data: TaskCreateRequest) => apiClient.post<Task>("/tasks", data),

    /** GET /tasks/{id} */
    getById: (id: number) => apiClient.get<Task>(`/tasks/${id}`),

    /** PUT /tasks/{id} */
    update: (id: number, data: TaskDto) => apiClient.put<Task>(`/tasks/${id}`, data),

    /** PATCH /tasks/{id} */
    patch: (id: number, data: TaskDto) => apiClient.patch<Task>(`/tasks/${id}`, data),

    /** DELETE /tasks/{id} */
    delete: (id: number) => apiClient.delete(`/tasks/${id}`),

    /** GET /tasks/{taskId}/submissions/me - Мої роботи по завданню */
    getMySubmissions: (taskId: number) => apiClient.get<Submission[]>(`/tasks/${taskId}/submissions/me`),

    /** GET /tasks/{taskId}/submissions - Роботи по завданню для конкретного користувача (teacher/admin must pass userId) */
    getSubmissions: async (taskId: number, userId?: number): Promise<Submission[]> => {
        const debug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debugSubs') === '1';
        try {
            const res = await apiClient.get(`/tasks/${taskId}/submissions`, { params: userId ? { userId } : {} });
            const raw = res.data;
            if (debug) {
                console.log('[SubmissionsDebug] Raw response', raw);
            }
            if (Array.isArray(raw)) {
                // Legacy / unexpected array shape already unified
                return raw as Submission[];
            }
            if (raw && typeof raw === 'object') {
                const files = Array.isArray(raw.files) ? raw.files : [];
                const tests = Array.isArray(raw.tests) ? raw.tests : [];
                const unifiedFiles: Submission[] = files.map((f: any) => ({
                    id: String(f.id), taskId: f.taskId, userId: f.userId, submitted: f.submitted,
                    status: f.status, grade: f.grade, contentUrl: f.contentUrl, content: undefined
                }));
                const unifiedTests: Submission[] = tests.map((t: any) => ({
                    id: String(t.id), taskId: t.taskId, userId: t.userId, submitted: t.submitted,
                    status: t.status, grade: t.grade, content: t.content, contentUrl: t.contentUrl
                }));
                const merged = [...unifiedFiles, ...unifiedTests].sort((a,b)=> new Date(a.submitted).getTime() - new Date(b.submitted).getTime());
                if (debug) {
                    console.log('[SubmissionsDebug] Normalized merged array', merged);
                }
                return merged;
            }
            return [];
        } catch (e) {
            if (debug) console.warn('[SubmissionsDebug] Error fetching submissions', e);
            return [];
        }
    },

    // --- Legacy Submission endpoints (v0) ---
    /** POST /tasks/{taskId}/submissions/test - Здати тест (старий метод) */
    submitTestLegacy: (taskId: number, content: string) =>
        apiClient.post(`/tasks/${taskId}/submissions/test`, content, {
            headers: { "Content-Type": "application/json" }
        }),

    /** POST /tasks/{taskId}/submissions/file - Здати файл (старий метод) */
    submitFileLegacy: (taskId: number, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiClient.post(`/tasks/${taskId}/submissions/file`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    }
};

export const submissionsApi = {
    // --- Extended (New) Endpoints ---

    /** POST /submissions-ext/test/{taskId} - Здати тест */
    submitTest: (taskId: number, data: TestSubmitRequest) =>
        apiClient.post(`/submissions-ext/test/${taskId}`, data),

    /** POST /submissions-ext/file/{taskId} - Здати файл */
    submitFile: (taskId: number, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiClient.post(`/submissions-ext/file/${taskId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    },

    /** GET /submissions-ext/tests/me - Всі мої тестові роботи */
    getMyTests: () => apiClient.get<Submission[]>("/submissions-ext/tests/me"),

    /** GET /submissions-ext/files/me - Всі мої файлові роботи */
    getMyFiles: () => apiClient.get<Submission[]>("/submissions-ext/files/me"),

    /** POST /submissions-ext/test/{submissionId}/grade - Оцінити тест */
    gradeTest: (submissionId: string, grade: number) =>
        apiClient.post(`/submissions-ext/test/${submissionId}/grade`, null, { params: { grade } }),

    /** POST /submissions-ext/file/{submissionId}/grade - Оцінити файл */
    gradeFile: (submissionId: string, grade: number) =>
        apiClient.post(`/submissions-ext/file/${submissionId}/grade`, null, { params: { grade } }),

    /** GET /submissions-ext/file/{submissionId}/download - Завантажити файл */
    downloadFile: (submissionId: string) =>
        apiClient.get(`/submissions-ext/file/${submissionId}/download`, { responseType: 'blob' }),

    // --- Legacy / Specific queries ---

    /** GET /submissions/task/{taskId}/grade - Отримати оцінку за завдання */
    getTaskGrade: (taskId: number, userId: number) =>
        apiClient.get<number>(`/submissions/task/${taskId}/grade`, { params: { userId } }),

    /** GET /submissions/course/{courseId}/grade - Середня оцінка за курс */
    getCourseGrade: (courseId: number, userId: number) =>
        apiClient.get<number>(`/submissions/course/${courseId}/grade`, { params: { userId } }),

    /** GET /submissions/task/{taskId}/user/{userId}/test/latest */
    getLatestTest: (taskId: number, userId: number) =>
        apiClient.get<Submission>(`/submissions/task/${taskId}/user/${userId}/test/latest`),

    /** GET /submissions/task/{taskId}/user/{userId}/file/latest */
    getLatestFile: (taskId: number, userId: number) =>
        apiClient.get<Submission>(`/submissions/task/${taskId}/user/${userId}/file/latest`),

    /** GET /submissions/user/{id}/tests - Всі тести конкретного юзера (для адміна/вчителя) */
    getUserTests: (userId: number) => apiClient.get<Submission[]>(`/submissions/user/${userId}/tests`),

    /** GET /submissions/user/{id}/files - Всі файли конкретного юзера */
    getUserFiles: (userId: number) => apiClient.get<Submission[]>(`/submissions/user/${userId}/files`),
};

export const adminRelationsApi = {
    // User <-> Group
    bindUserToGroup: (userId: number, groupId: number) =>
        apiClient.post(`/admin/relations/user/${userId}/group/${groupId}`),
    unbindUserFromGroup: (userId: number, groupId: number) =>
        apiClient.delete(`/admin/relations/user/${userId}/group/${groupId}`),

    // Topic <-> Course
    bindTopicToCourse: (topicId: number, courseId: number) =>
        apiClient.post(`/admin/relations/topic/${topicId}/course/${courseId}`),
    unbindTopicFromCourse: (topicId: number, courseId: number) =>
        apiClient.delete(`/admin/relations/topic/${topicId}/course/${courseId}`),

    // Teacher <-> Course
    bindTeacherToCourse: (teacherId: number, courseId: number) =>
        apiClient.post(`/admin/relations/teacher/${teacherId}/course/${courseId}`),
    unbindTeacherFromCourse: (teacherId: number, courseId: number) =>
        apiClient.delete(`/admin/relations/teacher/${teacherId}/course/${courseId}`),

    // Course <-> Group
    bindCourseToGroup: (courseId: number, groupId: number) =>
        apiClient.post(`/admin/relations/course/${courseId}/group/${groupId}`),
    unbindCourseFromGroup: (courseId: number, groupId: number) =>
        apiClient.delete(`/admin/relations/course/${courseId}/group/${groupId}`),
};

export const maintenanceApi = {
    /** POST /admin/maintenance/duplicates/cleanup - Видалити дублікати користувачів */
    cleanupDuplicates: () => apiClient.post("/admin/maintenance/duplicates/cleanup"),

    /** GET /admin/maintenance/duplicates - Показати дублікати */
    getDuplicates: () => apiClient.get("/admin/maintenance/duplicates"),
};

export const appApi = {
    /** GET /health - Перевірка статусу сервера */
    checkHealth: () => apiClient.get("/health"),
};

// --- FACADE APIS ---
// High-level grouped operations used by UI components.
export const adminApi = {
    // Lists
    getUsers: () => usersApi.getAll(),
    getCourses: () => coursesApi.getAll(),
    getGroups: () => groupsApi.getAll(),

    // Create entities
    createUser: (data: UserCreateRequest) => usersApi.create(data),
    createCourse: (data: CourseCreateRequest) => coursesApi.create(data),
    createGroup: (data: GroupCreateRequest) => groupsApi.create(data),
    createTopic: (data: TopicCreateRequest) => topicsApi.create(data),
    createTask: (data: TaskCreateRequest) => tasksApi.create(data),

    // Delete entities
    deleteUser: (id: number) => usersApi.delete(id),

    // Bind relations
    bindUserToGroup: (userId: number, groupId: number) => adminRelationsApi.bindUserToGroup(userId, groupId),
    bindTeacherToCourse: (teacherId: number, courseId: number) => adminRelationsApi.bindTeacherToCourse(teacherId, courseId),
    bindCourseToGroup: (courseId: number, groupId: number) => adminRelationsApi.bindCourseToGroup(courseId, groupId),

    // Unbind (optional usage later)
    unbindUserFromGroup: (userId: number, groupId: number) => adminRelationsApi.unbindUserFromGroup(userId, groupId),
    unbindTeacherFromCourse: (teacherId: number, courseId: number) => adminRelationsApi.unbindTeacherFromCourse(teacherId, courseId),
    unbindCourseFromGroup: (courseId: number, groupId: number) => adminRelationsApi.unbindCourseFromGroup(courseId, groupId),
};

export const commonApi = {
    // Topics & tasks retrieval
    getCourseTopics: (courseId: number) => coursesApi.getTopics(courseId),
    getTopicTasks: (topicId: number) => topicsApi.getTasks(topicId),
    getTaskById: (taskId: number) => tasksApi.getById(taskId),
    getTopicById: (topicId: number) => topicsApi.getById(topicId),
};

export const studentApi = {
    getMyCourses: (userId: number) => usersApi.getCourses(userId),
    getMyProfile: () => profilesApi.getMyStudentProfile(),
    getMySubmissionsForTask: (taskId: number) => tasksApi.getMySubmissions(taskId),
    submitFileTask: (taskId: number, file: File) => submissionsApi.submitFile(taskId, file),
    submitTestTask: (taskId: number, content: string) => submissionsApi.submitTest(taskId, { content }),
    getMyTestSubmissions: () => submissionsApi.getMyTests(),
    getMyFileSubmissions: () => submissionsApi.getMyFiles(),
};

export const teacherApi = {
    // Placeholder: until dedicated endpoint exists, reuse usersApi.getCourses
    getMyCourses: (userId: number) => usersApi.getCourses(userId),
    getMyProfile: () => profilesApi.getMyTeacherProfile(),
    getTaskSubmissions: (taskId: number) => tasksApi.getSubmissions(taskId),
    /** Get submissions for specific user (required by backend for teacher/admin) */
    getTaskSubmissionsForUser: (taskId: number, userId: number) => tasksApi.getSubmissions(taskId, userId),
    /** Placeholder for future aggregated endpoint (requires backend support) */
    getTaskSubmissionsAll: (taskId: number) => tasksApi.getSubmissions(taskId),
    getTestQuestions: (taskId: number) => testQuestionsApi.listByTask(taskId),
};

export const relationsApi = {
    getCourseGroups: (courseId: number) => apiClient.get<Group[]>(`/courses/${courseId}/groups`),
    getCourseTeachers: (courseId: number) => apiClient.get<User[]>(`/courses/${courseId}/teachers`),
    getGroupCourses: (groupId: number) => apiClient.get<Course[]>(`/groups/${groupId}/courses`),
    getTeacherCourses: (teacherId: number) => apiClient.get<Course[]>(`/teachers/${teacherId}/courses`),
    getGroupUsers: (groupId: number) => apiClient.get<User[]>(`/groups/${groupId}/users`),
    unbindCourseFromGroup: (courseId: number, groupId: number) => apiClient.delete(`/admin/relations/course/${courseId}/group/${groupId}`),
    unbindTeacherFromCourse: (teacherId: number, courseId: number) => apiClient.delete(`/admin/relations/teacher/${teacherId}/course/${courseId}`),
    getTeacherDetails: (teacherId: number) => apiClient.get(`/teachers/${teacherId}`),
};

export const testQuestionsApi = {
    create: (data: TestQuestionCreate) => apiClient.post<TestQuestion>("/test-questions", data),
    patch: (id: number, data: TestQuestionUpdate) => apiClient.patch<TestQuestion>(`/test-questions/${id}`, data),
    delete: (id: number) => apiClient.delete(`/test-questions/${id}`),
    listByTask: (taskId: number) => apiClient.get<TestQuestion[]>(`/test-questions/task/${taskId}`),
};

export default apiClient;

