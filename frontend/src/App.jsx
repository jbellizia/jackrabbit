// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import EditPost from "./pages/EditPost";
import PostPage from "./pages/PostPage";
import About from "./pages/About";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LoadingOverlay from "./components/LoadingOverlay";
import SplashLandingPage from "./components/SplashLandingPage";


function Layout() {
    const [globalLoading, setGlobalLoading] = useState(false);

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            {/* Main content should grow to fill space */}
            <main className="flex-1">
                <Outlet context={{ setGlobalLoading }} />
            </main>
            <LoadingOverlay show={globalLoading} />
            <Footer />
        </div>
    );
}
export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showSplash, setShowSplash] = useState(false);

    useEffect(() => {
        const start = Date.now();

        fetch(`${import.meta.env.VITE_API_URL}/api/check-auth`, { credentials: "include" })
            .then((res) => res.json())
            .then((data) => setIsAuthenticated(data.authenticated))
            .catch(() => setIsAuthenticated(false))
            .finally(() => {
                const elapsed = Date.now() - start;
                const minDuration = 700; // ms
                const remaining = Math.max(0, minDuration - elapsed);
                setTimeout(() => setLoading(false), remaining);
            });
    }, []);

    useEffect(() => {
        const hasVisited = sessionStorage.getItem("hasVisited");
        if (!hasVisited) {
            setShowSplash(true);
        }
    }, []);

    const handleEnter = () => {
        sessionStorage.setItem("hasVisited", "true");
        setShowSplash(false);
    };

    if (loading) {
        return <LoadingOverlay show={true} />;
    }

    return (
        <>
            {showSplash ? (
                <SplashLandingPage onEnter={handleEnter} />
            ) : (
                <Router>
                    <Routes>
                        <Route element={<Layout />}>
                            <Route path="/" element={<Home isAuthenticated={isAuthenticated} />} />
                            <Route path="/home" element={<Home isAuthenticated={isAuthenticated} />} />
                            <Route path="/post/:id" element={<PostPage isAuthenticated={isAuthenticated} />} />

                            <Route
                                path="/about"
                                element={<About isAuthenticated={isAuthenticated} />}
                            />

                            <Route
                                path="/login"
                                element={
                                    <PublicRoute isAuthenticated={isAuthenticated}>
                                        <Login setIsAuthenticated={setIsAuthenticated} />
                                    </PublicRoute>
                                }
                            />

                            <Route
                                path="/admin"
                                element={
                                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                                        <Admin setIsAuthenticated={setIsAuthenticated} />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/edit/:postId"
                                element={
                                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                                        <EditPost />
                                    </ProtectedRoute>
                                }
                            />
                        </Route>
                    </Routes>
                </Router>
            )}
        </>
    );

}
