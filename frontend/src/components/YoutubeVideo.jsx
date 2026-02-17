import React, { useEffect, useState } from "react";
import YouTube from "react-youtube";

function extractYouTubeId(url) {
    if (!url) return null;

    const regex =
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|embed|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;

    const match = url.match(regex);
    return match ? match[1] : null;
}

export default function YoutubeVideo({ url , parentStyling }) {
    const [videoId, setVideoId] = useState(null);
    const [canEmbed, setCanEmbed] = useState(true);

    useEffect(() => {
        const id = extractYouTubeId(url);
        setVideoId(id);
        setCanEmbed(true); // Reset on URL change
    }, [url]);

    const options = {
        width: "100%",
        height: "100%",
        playerVars: { autoplay: 0, controls: 1 },
    };

    function handleError(event) {
        const errorCode = event.data;
        console.warn("YouTube embed error:", errorCode);

        if (errorCode === 101 || errorCode === 150) {
            // Embedding disabled
            setCanEmbed(false);
        } else {
            // Other errors also fallback
            setCanEmbed(false);
        }
    }

    // FALLBACK if cannot embed
    if (!videoId || !canEmbed) {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="underline hover:underline cursor-pointer text-gray-700 hover:text-gray-900">
                        Watch on YouTube
            </a>
        );
    }

    return (
        <div className={parentStyling}>
            <YouTube
                videoId={videoId}
                opts={options}
                onError={handleError}
            />
        </div>
    );
}
