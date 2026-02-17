// src/utils/postActions.js
export async function deletePost(postId, setPosts = null) {
    if (!confirm("Are you sure you want to delete this post?")) return false;

    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${postId}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (!res.ok) {
            alert("Failed to delete post.");
            return false;
        }

        // Only update posts if setPosts is actually a function
        if (typeof setPosts === "function") {
            setPosts((prev) => prev.filter((post) => post.id !== postId));
        }

        return true;
    } catch (err) {
        console.error("Error deleting post:", err);
        alert("An error occurred while deleting the post.");
        return false;
    }
}
