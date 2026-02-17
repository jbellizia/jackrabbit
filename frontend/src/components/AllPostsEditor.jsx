import { useEffect, useState } from "react";
import { deletePost } from "../utils/postActions";
import { useNavigate } from "react-router-dom";



export default function AboutEditor() {
    const [status, setStatus] = useState("");
    const [posts, setPosts] = useState([]);

    const navigate = useNavigate();

    // Fetch current about info
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/posts`, { credentials: "include" })
            .then((res) => {
                if (!res.ok) throw new Error("Network response was not ok");
                return res.json();
            })
            .then(setPosts)
            .catch(() => setStatus("Failed to load posts data."));
    }, []);

    const handleVisibilityChange = async (postId, newValue) => {
        setStatus("Updating...");
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${postId}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    is_visible: newValue ? 1 : 0
                })
            });

            if (res.ok) {
                setStatus("Updated successfully!");
                const updatedPost = await fetch(`${import.meta.env.VITE_API_URL}/api/post/${postId}`, { credentials: "include" }).then(r => r.json());
                setPosts((prev) => prev.map(
                    p => p.id === postId ? updatedPost : p
                ));

            } else {
                const text = await res.text();
                setStatus(`Failed: ${text || "Server error"}`);
            }
        } catch (error) {
            console.error("Update failed:", error);
            setStatus("Network error");
        }
    };

    const handleDelete = async (postId) => deletePost(postId, setPosts);

    return (
        <div className="w-[90vw] md:w-[75vw] lg:w-[60vw] mx-auto flex flex-col gap-5 mt-[2.5vw] self-center border-1 p-5">
            {/* {status && <p className="text-sm text-gray-500 h-5">{status}</p>} */}  
            <div className="flex flex-row justify-between border-b">
                <h3 className="text-2xl">Post Title</h3>
                <h3 className="text-2xl">Visibility</h3>
                
            </div>          
            {posts.map((post) => (
                <div key={post.id} className="grid grid-cols-4 items-center border-b border-gray-200 py-2 text-center">
                    <h3 className="text-xl text-left">{post.title}</h3>

                    <button onClick={(id) => navigate(`/edit/${post.id}`)} className="hover:underline cursor-pointer">Edit</button>
                    <button onClick={() => handleDelete(post.id)} className="hover:underline cursor-pointer">Delete</button>


                    <label className="flex items-center gap-2 ml-auto">
                        <input
                            type="checkbox"
                            checked={post.is_visible === 1}
                            onChange={(e) =>
                                handleVisibilityChange(post.id, e.target.checked)
                            }
                            className="cursor-pointer"
                        />
                    </label>
                </div>
            ))}
        </div>
    );
}
