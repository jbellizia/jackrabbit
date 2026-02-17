// src/pages/PostPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import YoutubeVideo from "../components/YoutubeVideo";
import { deletePost } from "../utils/postActions";
import { useNavigate } from "react-router-dom";


export default function PostPage({ isAuthenticated = false, onEdit, onDelete }) {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const navigate = useNavigate();

    const handleDelete = async () => {
        const success = await deletePost(post.id); 
        await new Promise((r) => setTimeout(r, 300));
        if (success) navigate("/"); 
    };

    useEffect(() => {
        fetch(`${ import.meta.env.VITE_API_URL }/api/post/${id}`, { credentials: "include" })
            .then((res) => res.json())
            .then(setPost);
        }, [id]);

    if (!post) return <p className="m-[5vw] text-center">NO POST FOUND</p>;

    return (
        <div className="w-[90vw] md:w-[75vw] lg:w-[60vw] m-auto flex flex-col gap-5 mt-[2vw]">

            <h2 className="text-3xl self-center">{post.title}</h2>
            <div name="post-media" className="self-center min-w-0" >
                {post.media_type === "image" && post.media_href && (
                    <img
                        src={post.media_href}
                        alt={post.title}
                        className="w-[30vw]"
                    />
                )}

                {post.media_type === "video" && post.media_href && (
                    <YoutubeVideo url={post.media_href} parentStyling="w-[80vw] h-[45vw] md:w-[70vw] md:h-[40vw] lg:w-[60vw] lg:h-[30vw] [&_*]:w-full [&_*]:h-full"/>
                )}

                {post.media_type === "link" && post.media_href && (
                    <a href={post.media_href} target="_blank" rel="noopener noreferrer" className="underline hover:underline cursor-pointer text-gray-700 hover:text-gray-900 break-all">
                        {post.media_href}
                    </a>
                )}

                {post.media_type === "audio" && post.media_href && (
                    <audio src={post.media_href} controls />
                )}
            </div>
            <p>{post.writeup}</p>

            
            <div className="mt-auto flex flex-row cursor-auto">
                {isAuthenticated && (
                    <div className="ml-auto">
                        <button onClick={() => navigate(`/edit/${post.id}`)} className="pl-[.5vw] pr-[.5vw] hover:underline cursor-pointer">Edit</button>
                        <button onClick={handleDelete} className="pl-[0.5vw] pr-[.5vw] hover:underline cursor-pointer">Delete</button>
                    </div>
                )}
            </div>

            
        </div>
    );
}