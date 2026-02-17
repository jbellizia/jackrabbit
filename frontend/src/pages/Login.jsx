// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";

export default function Login({ setIsAuthenticated }) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { setGlobalLoading } = useOutletContext();
    const handleSubmit = async (e) => {

        e.preventDefault();
        setError("");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ password }),
        });

        if (res.ok) {
            setIsAuthenticated(true);
            navigate("/admin");
        } else {
            setError("Invalid password");
        }
    };

    return (
        <div className="mt-[2.5vw]">
            <form
                onSubmit={handleSubmit}
                className="w-[60vw] ml-[20vw] mr-[20vw] flex flex-col gap-5 cursor-default"
            >
                <h1 className="text-3xl self-center">Admin Login</h1>
                {error && <p className="text-red-500">{error}</p>}
                <input
                    type="password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className=""
                />
                <button
                    type="submit"
                    className="border cursor-pointer p-2 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                    Login
                </button>
            </form>
        </div>
    );
}

