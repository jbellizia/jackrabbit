import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PostCard from "../components/PostCard";
import { deletePost } from "../utils/postActions";
import { useOutletContext } from "react-router-dom";

export default function Home({ isAuthenticated }) {
    const [posts, setPosts] = useState([]);
    const [margins, setMargins] = useState([]);    
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);

    const navigate = useNavigate();
    const { setGlobalLoading } = useOutletContext();

    useEffect(() => {
        
        fetch(`${ import.meta.env.VITE_API_URL}/api/posts`, { credentials: "include" })
            .then((res) => {
                if (!res.ok) throw new Error("Network response was not ok");
                return res.json();
            })
            .then(setPosts)
            .catch((err) => console.error("Fetch posts failed:", err));
    }, []);

    useEffect(() => {
        const onResize = () => setScreenWidth(window.innerWidth);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    useEffect(() => {
        if (posts.length > 0) {
            const newMargins = posts.map(() => {
                const min = 3;
                const max = 30;
                return Math.floor(Math.random() * (max - min) + min);
            });
            setMargins(newMargins);
        }
    }, [posts]);

    const handleDelete = (postId) => deletePost(postId, setPosts);

    return (
        <div className="posts my-[2vw] mx-[2vw] md:mx-[1vw] lg:mx-[2vw] flex flex-col gap-5">
            {posts.map((post, index) => {
                if (post.is_visible !== 1) return null;

                const style =
                    screenWidth < 768
                        ? { margin: "auto" }
                        : { marginLeft: `${margins[index]}%` };

                return (
                    <div key={post.id} style={style}>
                        <PostCard
                            post={post}
                            isAuthenticated={isAuthenticated}
                            onEdit={(id) => navigate(`/edit/${id}`)}
                            onDelete={handleDelete}
                        />
                    </div>
                );
            })}
        </div>
    );
}
