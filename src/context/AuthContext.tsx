import {
    createContext,
    useContext,
    useState,
    useEffect,
} from "react";
import type { ReactNode } from "react";
import type { AuthContextType, UserExtended } from "../types";
import { usersApi } from "../api/apiService";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserExtended | null>(null);
    const [token, setToken] = useState<string | null>(
        localStorage.getItem("accessToken")
    );
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = async () => {
        if (localStorage.getItem("accessToken")) {
            try {
                const response = await usersApi.getMe();
                setUser(response.data);
            } catch (error) {
                console.error("Failed to fetch user", error);
                localStorage.removeItem("accessToken");
                setToken(null);
                setUser(null);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchUser();
    }, [token]);

    const login = async (newToken: string) => {
        localStorage.setItem("accessToken", newToken);
        setToken(newToken);
        await fetchUser();
    };

    const logout = () => {
        localStorage.removeItem("accessToken");
        setToken(null);
        setUser(null);
    };

    if (isLoading) {
        return <div className="auth-container"><p>Завантаження...</p></div>;
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};