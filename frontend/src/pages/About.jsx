// src/components/About.jsx
import { useState, useEffect } from "react";


export default function About(isAuthenticated=false) {
    const [about, setAbout] = useState({ header: "", body: "" });

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/about`, { credentials: "include" })
            .then((res) => {
                if (!res.ok) throw new Error("Network response was not ok");
                return res.json(); // <--- return here
            })
            .then((data) => setAbout(data))
            .catch(() => setAbout({ header: "Not found", body: "" }));
    }, []);

    return (
        <div className="w-[90vw] md:w-[75vw] lg:w-[60vw] m-auto flex flex-col gap-5 mt-[2vw]">
            <h1 className="text-3xl self-center">{about.header}</h1>
            <p className="">{about.body}</p>
        </div>
    );
}
