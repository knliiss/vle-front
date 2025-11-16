import type { User, Course, Group, Topic, Task } from "../types";

const KEY = "vle_local_store_v1";

interface StoreShape {
    users: User[];
    courses: Course[];
    groups: Group[];
    topics: Topic[];
    tasks: Task[];
}

function readStore(): StoreShape {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) {
            const seed: StoreShape = { users: [], courses: [], groups: [], topics: [], tasks: [] };
            localStorage.setItem(KEY, JSON.stringify(seed));
            return seed;
        }
        return JSON.parse(raw) as StoreShape;
    } catch (err) {
        const seed: StoreShape = { users: [], courses: [], groups: [], topics: [], tasks: [] };
        localStorage.setItem(KEY, JSON.stringify(seed));
        return seed;
    }
}

function writeStore(store: StoreShape) {
    localStorage.setItem(KEY, JSON.stringify(store));
}

function generateId(): number {
    // keep numeric id compatible with backend; use timestamp as fallback
    return Date.now();
}

export const localStore = {
    getUsers: async (): Promise<{ data: User[] }> => {
        const s = readStore();
        return { data: s.users };
    },
    createUser: async (data: Partial<User>): Promise<{ data: User }> => {
        const s = readStore();
        const id = generateId();
        const user: User = {
            id,
            username: data.username || `user_${id}`,
            role: (data.role as any) || "STUDENT",
            groupId: data.groupId,
            avatarUrl: data.avatarUrl,
        };
        s.users.push(user);
        writeStore(s);
        return { data: user };
    },
    updateUser: async (id: number, data: Partial<User>): Promise<{ data: User }> => {
        const s = readStore();
        const idx = s.users.findIndex((u) => u.id === id);
        if (idx === -1) throw new Error("User not found");
        const updated = { ...s.users[idx], ...data };
        s.users[idx] = updated;
        writeStore(s);
        return { data: updated };
    },
    deleteUser: async (id: number): Promise<{ data: null }> => {
        const s = readStore();
        s.users = s.users.filter((u) => u.id !== id);
        writeStore(s);
        return { data: null };
    },

    getCourses: async (): Promise<{ data: Course[] }> => {
        const s = readStore();
        return { data: s.courses };
    },
    createCourse: async (data: Partial<Course>): Promise<{ data: Course }> => {
        const s = readStore();
        const id = generateId();
        const course: Course = { id, name: data.name || `Course ${id}` };
        s.courses.push(course);
        writeStore(s);
        return { data: course };
    },
    updateCourse: async (id: number, data: Partial<Course>): Promise<{ data: Course }> => {
        const s = readStore();
        const idx = s.courses.findIndex((c) => c.id === id);
        if (idx === -1) throw new Error("Course not found");
        const updated = { ...s.courses[idx], ...data };
        s.courses[idx] = updated;
        writeStore(s);
        return { data: updated };
    },
    deleteCourse: async (id: number): Promise<{ data: null }> => {
        const s = readStore();
        s.courses = s.courses.filter((c) => c.id !== id);
        // also cascade topics/tasks belonging to this course
        s.topics = s.topics.filter((t) => t.courseId !== id);
        s.tasks = s.tasks.filter((tk) => tk.topicId == null || s.topics.find((t) => t.id === tk.topicId));
        writeStore(s);
        return { data: null };
    },

    getGroups: async (): Promise<{ data: Group[] }> => {
        const s = readStore();
        return { data: s.groups };
    },
    createGroup: async (data: Partial<Group>): Promise<{ data: Group }> => {
        const s = readStore();
        const id = generateId();
        const group: Group = { id, name: data.name || `Group ${id}` };
        s.groups.push(group);
        writeStore(s);
        return { data: group };
    },
    updateGroup: async (id: number, data: Partial<Group>): Promise<{ data: Group }> => {
        const s = readStore();
        const idx = s.groups.findIndex((g) => g.id === id);
        if (idx === -1) throw new Error("Group not found");
        const updated = { ...s.groups[idx], ...data };
        s.groups[idx] = updated;
        writeStore(s);
        return { data: updated };
    },
    deleteGroup: async (id: number): Promise<{ data: null }> => {
        const s = readStore();
        s.groups = s.groups.filter((g) => g.id !== id);
        // unbind users from this group
        s.users = s.users.map((u) => (u.groupId === id ? { ...u, groupId: undefined } : u));
        writeStore(s);
        return { data: null };
    },

    getCourseTopics: async (courseId: number): Promise<{ data: Topic[] }> => {
        const s = readStore();
        return { data: s.topics.filter((t) => t.courseId === courseId) };
    },
    createTopic: async (courseId: number, data: Partial<Topic>): Promise<{ data: Topic }> => {
        const s = readStore();
        const id = generateId();
        const topic: Topic = { id, name: data.name || `Topic ${id}`, description: data.description, courseId };
        s.topics.push(topic);
        writeStore(s);
        return { data: topic };
    },
    updateTopic: async (id: number, data: Partial<Topic>): Promise<{ data: Topic }> => {
        const s = readStore();
        const idx = s.topics.findIndex((t) => t.id === id);
        if (idx === -1) throw new Error("Topic not found");
        const updated = { ...s.topics[idx], ...data };
        s.topics[idx] = updated;
        writeStore(s);
        return { data: updated };
    },
    deleteTopic: async (id: number): Promise<{ data: null }> => {
        const s = readStore();
        s.topics = s.topics.filter((t) => t.id !== id);
        // also delete tasks for this topic
        s.tasks = s.tasks.filter((tk) => tk.topicId !== id);
        writeStore(s);
        return { data: null };
    },

    getTopicTasks: async (topicId: number): Promise<{ data: Task[] }> => {
        const s = readStore();
        return { data: s.tasks.filter((t) => t.topicId === topicId) };
    },
    createTask: async (topicId: number, data: Partial<Task>): Promise<{ data: Task }> => {
        const s = readStore();
        const id = generateId();
        const task: Task = { id, name: data.name || `Task ${id}`, description: data.description, topicId };
        s.tasks.push(task);
        writeStore(s);
        return { data: task };
    },
};

export default localStore;
