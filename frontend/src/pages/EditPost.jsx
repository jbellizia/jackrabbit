import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useState, useEffect } from "react";

export default function EditPost() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { setGlobalLoading } = useOutletContext();
    const [post, setPost] = useState(null);
    const [title, setTitle] = useState("");
    const [blurb, setBlurb] = useState("");
    const [writeup, setWriteup] = useState("");
    const [mediaType, setMediaType] = useState("none");
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaHref, setMediaHref] = useState("");
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/post/${postId}`, {
            credentials: "include"
        })
        .then(res => {
            if (!res.ok) throw new Error("Failed to load post");
            return res.json();
        })
        .then((data) => {
            setPost(data);
            setTitle(data.title || "");
            setBlurb(data.blurb || "");
            setWriteup(data.writeup || "");
            setMediaType(data.media_type || "none");
            setMediaHref(data.media_href || "");
            setIsVisible(Boolean(data.is_visible));
            setMediaFile(null);
        })
        .catch(() => setPost(null));
    }, [postId]);


    const externalTypes = ["video", "link"];
    const handleMediaTypeChange = (e) => {
        const new_type = e.target.value;
        const prevType = mediaType;

        if (externalTypes.includes(prevType) && externalTypes.includes(new_type)) {
            setMediaType(new_type);
            return;
        }

        if (prevType !== "none" && prevType !== new_type) {
            const confirmed = window.confirm(
                "Changing the media type will remove the current media from this post. Are you sure?"
            );
            if (!confirmed) {
                e.target.value = prevType;
                return;
            }
            setMediaFile(null);
            setMediaHref("");
        }

        setMediaType(new_type);
    };


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
                "Content-Type": file.type || "application/octet-stream"
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
            let finalMediaHref = mediaHref; // default: keep existing

            // Upload ONLY if user selected a new file
            if (
                (mediaType === "image" || mediaType === "audio") &&
                mediaFile
            ) {
                finalMediaHref = await uploadToS3(mediaFile);
            }

            // Explicitly clear media
            if (mediaType === "none") {
                finalMediaHref = null;
            }

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/posts/${postId}`,
                {
                    method: "PUT",
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
                throw new Error(text || "Failed to update post");
            }

            alert("Post updated successfully");
            navigate("/admin"); // or wherever makes sense
        } catch (err) {
            alert("Failed to update post: " + err.message);
        } finally {
            setGlobalLoading(false);
        }
    };





    if (!post) return <p>Post not found</p>;

    return (
        <div className="w-[60vw] ml-[20vw] mr-[20vw] flex flex-col gap-5 cursor-default mt-[2.5vw]">
            <h2 className="text-3xl self-center">Edit Post</h2>
            <form onSubmit={handleSubmit} className="flex-col flex gap-5">
                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border p-2"
                />
                <input
                    type="text"
                    placeholder="Blurb"
                    value={blurb}
                    onChange={(e) => setBlurb(e.target.value)}
                    className="border p-2"
                />
                <textarea
                    placeholder="Writeup"
                    value={writeup}
                    onChange={(e) => setWriteup(e.target.value)}
                    className="border p-2"
                />
                <select value={mediaType} onChange={handleMediaTypeChange} className="border p-2">
                    <option value="none">None</option>
                    <option value="image">Image</option>
                    <option value="video">Youtube Video</option>
                    <option value="audio">Audio</option>
                    <option value="link">Link</option>
                </select>

                {mediaType === "image" ? (
                    <div className="flex flex-col gap-3">
                        {mediaHref && !mediaFile && (
                            <img src={mediaHref} alt="Current" className="w-[50%] self-center"/>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setMediaFile(e.target.files[0])}
                            className="cursor-pointer p-2 hover:bg-gray-100 rounded-md border"
                        />
                    </div>
                ) : mediaType === "video" || mediaType === "link" ? (
                    <input
                        type="text"
                        placeholder="Media URL"
                        value={mediaHref ?? ""}
                        onChange={(e) => setMediaHref(e.target.value)}
                        className="border block p-2"
                    />
                ) : mediaType === "audio" ? (
                    <div>
                        {mediaHref && !mediaFile && (
                            <audio controls src={mediaHref} />
                        )}
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => setMediaFile(e.target.files[0])}
                            className="cursor-pointer p-2 hover:bg-gray-200 rounded-md border"
                        />
                    </div>
                ) : null}
                <div>
                    <label >
                        Make post visible
                    </label>
                    <input type="hidden" name="is_visible" value="0" />
                    <input
                        type="checkbox"
                        name="is_visible"
                        id="is_visible"
                        value="1"
                        checked={!!isVisible}
                        onChange={(e) => setIsVisible(e.target.checked)}
                    />
                </div>
                <button type="submit" className="border cursor-pointer p-2 bg-gray-100 hover:bg-gray-200 rounded-md">
                    Update Post
                </button>
            </form>
        </div>
    );
}
