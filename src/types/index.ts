// src/types/index.ts

// --- ENUMS ---

export type UserRole = "ADMINISTRATOR" | "TEACHER" | "STUDENT";

export type SubmissionStatus =
    | "ADDED"
    | "GRADED"
    | "RETURNED"
    | "REMOVED"
    | "OVERDUE";

// --- USER & PROFILES ---

/** Базовий об'єкт користувача (UserDto) */
export interface User {
    id: number;
    username: string;
    role: UserRole;
    fio?: string;       // Повне ім'я (ФИО)
    avatarUrl?: string;
    groupId?: number;   // ID групи (для студентів, сумісність)
}

/** Розширений об'єкт користувача (UserExtendedDto) */
export interface UserExtended extends User {
    // Поля для студента
    groupId?: number;

    // Поля для викладача та адміністратора
    academicTitle?: string;    // Вчене звання
    department?: string;       // Кафедра / Відділ
    workPhone?: string;        // Робочий телефон
    scientificDegree?: string; // Науковий ступінь
}

// --- REQUEST DTOS (Для відправки даних на сервер) ---

export interface UserCreateRequest {
    username: string;
    password: string;
    role: string; // Або UserRole
    fio?: string;
    groupId?: number;
}

export interface UserUpdateRequest {
    avatarUrl?: string;
    password?: string; // Plain text, буде захешовано
    fio?: string;
    groupId?: number;
}

export interface TeacherProfileUpdateRequest {
    academicTitle?: string;
    department?: string;
    workPhone?: string;
    scientificDegree?: string;
}

export interface StudentProfileUpdateRequest {
    groupId?: number;
}

export interface AdminProfileUpdateRequest {
    department?: string;
}

// --- AUTH ---

export interface TokenPairResponse {
    accessToken: string;
    refreshToken: string;
}

export interface AuthContextType {
    user: UserExtended | null; // Використовуємо розширений тип у контексті
    token: string | null;
    login: (token: string) => Promise<void>;
    logout: () => void;
}

// --- LMS ENTITIES ---

export interface Course {
    id: number;
    name: string;
}

// Використовується для списків, де може бути менше полів ніж у повній сутності
export interface CourseDto {
    id: number;
    name: string;
}

export interface Group {
    id: number;
    name: string;
}

export interface GroupDto {
    id: number;
    name: string;
}

export interface Topic {
    id: number;
    name: string;
    description?: string;
    courseId: number;
}

export interface TopicDto {
    name: string;
    description?: string;
    courseId: number;
}

export interface Task {
    id: number;
    name: string;
    description?: string;
    maxMark?: number;
    creationDate?: string; // ISO Date string
    dueDate?: string;      // ISO Date string
    topicId: number;
    taskType?: string; // NEW: e.g. TEST, LAB
}

export interface TaskDto {
    name: string;
    description?: string;
    maxMark?: number;
    dueDate?: string;
    topicId: number;
    taskType?: string; // NEW
}

// --- CREATE REQUESTS (body payloads without id) ---
export interface CourseCreateRequest { name: string; }
export interface GroupCreateRequest { name: string; }
export interface TopicCreateRequest { name: string; description?: string; courseId: number; }
export interface TaskCreateRequest { name: string; description?: string; maxMark?: number; dueDate?: string; topicId: number; taskType?: string; }

// --- SUBMISSIONS ---

/** Універсальний інтерфейс для подання (об'єднує Test та File) */
export interface Submission {
    id: string;
    taskId: number;
    userId: number;
    submitted: string;
    status: SubmissionStatus;
    grade?: number;

    contentUrl?: string;
    content?: string;
}

export interface TestSubmitRequest {
    content: string;
}

export interface TestQuestion {
    id: number;
    taskId: number;
    order: number;
    text: string;
    questionType: string;
    optionsJson?: string;
    maxScore?: number;
}
export interface TestQuestionCreate { taskId: number; order: number; text: string; questionType: string; optionsJson?: string; maxScore?: number; }
export interface TestQuestionUpdate { order?: number; text?: string; questionType?: string; optionsJson?: string; maxScore?: number; }

export interface CombinedSubmission {
    id: string;
    taskId: number;
    userId: number;
    submitted: string;
    status: SubmissionStatus | string;
    grade?: number | null;
    fileName?: string | null;
    contentUrl?: string | null;
    mimeType?: string | null;
    size?: number | null;
    content?: any | null;
}
