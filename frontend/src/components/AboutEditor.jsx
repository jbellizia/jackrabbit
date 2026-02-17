import { useEffect, useState } from "react";

export default function AboutEditor() {
    const [header, setHeader] = useState("");
    const [body, setBody] = useState("");
    const [status, setStatus] = useState("");

    // Fetch current about info
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/about`)
            .then((res) => res.json())
            .then((data) => {
                setHeader(data.header || "");
                setBody(data.body || "");
            })
            .catch(() => setStatus("Failed to load About data."));
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setStatus("Saving...");

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/about`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ header, body }),
        });

        if (res.ok) {
            setStatus("Saved successfully!");
        } else {
            setStatus("Failed to save changes.");
        }
    };

    return (
        <div className="w-[90vw] md:w-[75vw] lg:w-[60vw] mx-auto flex flex-col gap-5 mt-[2.5vw]">
            <form onSubmit={handleSave} className="flex-col flex gap-5">
                <p className="text-center text-sm text-gray-500">{status}</p>
                <input
                    type="text"
                    placeholder="Header"
                    value={header}
                    onChange={(e) => setHeader(e.target.value)}
                    className="border p-2"
                />
                <textarea
                    placeholder="Body"
                    value={body}
                    rows="6"
                    onChange={(e) => setBody(e.target.value)}
                    className="border p-2"
                />
                <button
                    type="submit"
                    className="border bg-gray-100 hover:bg-gray-200 p-2 rounded-md cursor-pointer"
                >
                    Save
                </button>
                
            </form>
        </div>
    );
}
