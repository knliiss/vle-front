import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from './Footer';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = () => setSidebarOpen(o => !o);
    const location = useLocation();
    const { user } = useAuth();

    useEffect(() => {
        setSidebarOpen(false);
        let sweeps = 0;
        const sweep = () => {
            sweeps++;
            const candidates: HTMLElement[] = [];
            document.querySelectorAll('body *').forEach(n => {
                const el = n as HTMLElement;
                if (!el || el.id === 'root') return;
                const style = getComputedStyle(el);
                const isFixed = style.position === 'fixed' || style.position === 'sticky';
                if (!isFixed) return;
                const rect = el.getBoundingClientRect();
                const covers = rect.width >= window.innerWidth * 0.95 && rect.height >= window.innerHeight * 0.95;
                if (!covers) return;
                const isKnown = el.classList.contains('modal-backdrop') || el.classList.contains('sidebar-overlay-backdrop');
                if (!isKnown) candidates.push(el);
            });
            if (candidates.length && user?.role === 'STUDENT') {
                console.warn('[OverlaySweep] Found candidates', candidates.map(c => ({ tag: c.tagName, id: c.id, class: c.className })));
                candidates.forEach(c => {
                    // Remove only if opaque background
                    const bg = getComputedStyle(c).backgroundColor;
                    if (bg && bg !== 'transparent') {
                        c.parentElement?.removeChild(c);
                        console.warn('[OverlaySweep] Removed candidate', c);
                    }
                });
            }
            if (sweeps < 8) setTimeout(sweep, 750);
        };
        setTimeout(sweep, 100);
    }, [location.pathname, user?.role]);

    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= 901 && sidebarOpen) setSidebarOpen(false);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [sidebarOpen]);

    return (
        <div className="app-layout">
            <Header onToggleSidebar={toggleSidebar} />
            <div className="app-body">
                <Sidebar open={sidebarOpen} />
                {/* Responsive overlay sidebar duplication for mobile */}
                {/* On desktop original Sidebar remains; on mobile we control class */}
                {/* Apply open class via direct DOM adjustment: simpler to add class to existing Sidebar via global CSS. */}
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
            {/* Backdrop for mobile sidebar */}
            {sidebarOpen && <div className="sidebar-overlay-backdrop" onClick={toggleSidebar} />}
            <Footer />
        </div>
    );
};

export default Layout;