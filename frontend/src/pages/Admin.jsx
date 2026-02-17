// src/pages/Admin.jsx (updated with image upload)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import AboutEditor from "../components/AboutEditor";
import AllPostsEditor from "../components/AllPostsEditor";


export default function Admin({setIsAuthenticated}) {
    const [title, setTitle] = useState("");
    const [blurb, setBlurb] = useState("");
    const [writeup, setWriteup] = useState("");
    const [mediaType, setMediaType] = useState("none");
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaHref, setMediaHref] = useState("");
    const [isVisible, setIsVisible] = useState(1);
    const navigate = useNavigate();
    const { setGlobalLoading } = useOutletContext();

    const [tab, setTab] = useState("post");

    const uploadToS3 = async (file) => {
        const ext = file.name.split(".").pop();

        const presignRes = await fetch(
            `${import.meta.env.VITE_API_URL}/api/uploads/presign`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    content_type: file.type,
                    file_ext: ext
                })
            }
        );

        if (!presignRes.ok) {
            throw new Error("Failed to get presigned URL");
        }

        const { upload_url, public_url } = await presignRes.json();

        const uploadRes = await fetch(upload_url, {
            method: "PUT",
            headers: {
                "Content-Type": file.type
            },
            body: file
        });

        if (!uploadRes.ok) {
            throw new Error("S3 upload failed");
        }

        return public_url;
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setGlobalLoading(true);

        try {
            let finalMediaHref = mediaHref || null;

            // 1. Upload image/audio directly to S3
            if (
                (mediaType === "image" || mediaType === "audio") &&
                mediaFile
            ) {
                finalMediaHref = await uploadToS3(mediaFile);
            }

            // 2. Create post (JSON only)
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/posts`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        title,
                        blurb,
                        writeup,
                        media_type: mediaType,
                        media_href: finalMediaHref,
                        is_visible: isVisible ? 1 : 0
                    })
                }
            );

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to create post");
            }

            // 3. Reset form
            setTitle("");
            setBlurb("");
            setWriteup("");
            setMediaHref("");
            setMediaFile(null);
            setIsVisible(1);

            await new Promise((r) => setTimeout(r, 300));
            navigate("/home");
            alert("Post created!");
        } catch (err) {
            alert("Failed to create post: " + err.message);
        } finally {
            setGlobalLoading(false);
        }
    };


    const handleLogout = async () => {
        const res = await fetch(`${ import.meta.env.VITE_API_URL}/api/logout`, {
            method: "POST",
            credentials: "include",
        });

        if (res.ok) {
            setIsAuthenticated(false); 
            await new Promise((r) => setTimeout(r, 300));
            navigate("/login");         
        } else {
            alert("Logout failed.");
        }
    };
    const handleMediaTypeChange = (e) => {
        const newType = e.target.value;
        // If switching between external link types (video <-> link), keep the mediaHref so it autofills
        const externalTypes = ["video", "link"];
        if (externalTypes.includes(mediaType) && externalTypes.includes(newType)) {
            setMediaType(newType);
            // keep mediaHref
            setMediaFile(null);
            return;
        }

        setMediaType(newType);
        setMediaFile(null);
        setMediaHref("");
    };
    return (
        <div className="flex flex-col">
            <h2 className="text-3xl self-center mt-[2.5vw]">Admin Dashboard</h2>

            <div className="flex justify-center gap-4 mb-4 mt-4">
                <button
                    className={`p-2 rounded-md border hover:bg-gray-400 cursor-pointer ${tab === "post" ? "bg-gray-300" : "bg-gray-100"}`}
                    onClick={() => setTab("post")}
                >
                    Create Post
                </button>
                <button
                    className={`p-2 rounded-md border hover:bg-gray-400 cursor-pointer ${tab === "about" ? "bg-gray-300" : "bg-gray-100"}`}
                    onClick={() => setTab("about")}
                >
                    About
                </button>
                <button
                    className={`p-2 rounded-md border hover:bg-gray-400 cursor-pointer ${tab === "all-posts" ? "bg-gray-300" : "bg-gray-100"}`}
                    onClick={() => setTab("all-posts")}
                >
                    All Posts
                </button>
            </div>
            {tab === "post" ? (
                <div className="w-[90vw] md:w-[75vw] lg:w-[60vw] mx-auto flex flex-col gap-5 mt-[2.5vw]">

                    <form
                        onSubmit={handleSubmit}
                        className="flex-col flex gap-5"
                    >
                        <input
                            type="text"
                            placeholder="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="border p-2 "
                        />

                        <textarea
                            placeholder="Blurb"
                            value={blurb}
                            rows="3"
                            onChange={(e) => setBlurb(e.target.value)}
                            className="border p-2 "
                        />

                        <textarea
                            placeholder="Writeup"
                            value={writeup}
                            rows="5"
                            onChange={(e) => setWriteup(e.target.value)}
                            className="border p-2 "
                        />
                        <div className="flex-col flex gap-2">
                            <label htmlFor="media-type">Media Type</label>
                            <select
                                value={mediaType}
                                onChange={handleMediaTypeChange}
                                className="border cursor-pointer p-2 "
                                name="media-type"
                            >
                                <option value="none">None</option>
                                <option value="image">Image</option>
                                <option value="video">Youtube Video</option>
                                <option value="audio">Audio</option>
                                <option value="link">Link</option>
                            </select>
                            {mediaType === "image" ? (
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setMediaFile(e.target.files[0])}
                                    className="cursor-pointer p-2 hover:bg-gray-100 rounded-md border"
                                    key="file-input"
                                />
                            ) : (mediaType === "video" || mediaType === "link") ? (
                                <input
                                    type="text"
                                    placeholder="Media URL"
                                    value={mediaHref ?? ""}
                                    onChange={(e) => setMediaHref(e.target.value)}
                                    className="border block p-2"
                                    key="url-input"
                                />
                            ) : mediaType === "audio" ? (
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={(e) => setMediaFile(e.target.files[0])}
                                    className="cursor-pointer p-2 hover:bg-gray-300 rounded-md border"
                                    key="file-input"
                                />
                            ) : null}
                        </div>
                        <div>
                            <label >
                                Make post visible
                            </label>
                            <input
                                type="checkbox"
                                name="is_visible"
                                id="is_visible"
                                checked={!!isVisible}
                                onChange={(e) => setIsVisible(e.target.checked)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="border cursor-pointer p-2 bg-gray-100 hover:bg-gray-300 rounded-md"
                        >
                            Create Post
                        </button>
                    </form>
                    <div className="self-center cursor-pointer">
                        <button onClick={handleLogout} className="border bg-red-100 cursor-pointer p-2 hover:bg-red-200 rounded-md" >
                            Logout
                        </button>
                    </div>
                </div>
            ): tab === "about" ? (
                <AboutEditor />
            ): (
                <AllPostsEditor />
            )}
        </div>
    );
}