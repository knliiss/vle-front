export type UserRole = "ADMINISTRATOR" | "TEACHER" | "STUDENT";

export interface User {
    id: number;
    username: string;
    role: UserRole;
    groupId?: number;
    avatarUrl?: string;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string) => Promise<void>;
    logout: () => void;
}

export interface Course {
    id: number;
    name: string;
}

export interface Group {
    id: number;
    name: string;
}

export interface Topic {
    id: number;
    name: string;
    description?: string;
    courseId?: number;
}

export interface Task {
    id: number;
    name: string;
    description?: string;
    maxMark?: number;
    creationDate?: string;
    dueDate?: string;
    topicId?: number;
}

export type SubmissionStatus =
    | "ADDED"
    | "GRADED"
    | "RETURNED"
    | "REMOVED"
    | "OVERDUE";

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