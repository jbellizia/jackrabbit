import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import YoutubeVideo from "./YoutubeVideo";

export default function PostCard({ post, isAuthenticated = false, onEdit, onDelete }) {
    return (
        <section name="post-card" className="flex flex-col gap-4 w-[90vw] md:w-[66vw] p-[1vw] border cursor-default">

            <h2 className="text-3xl ">{post.title}</h2>
            <p className ={`${post.blurb === '' ? "hidden" : ""}`}>{post.blurb}</p>

            <div name="post-media" className={`min-w-0 ${post.media_type === 'video' || post.media_type === 'image' ? "self-center " : ""} ${post.media_type === 'none' ? "hidden" : ""}`}>
                {post.media_type === "image" && post.media_href && (
                    <img
                        src={post.media_href}
                        alt={post.title}
                        className="w-[30vw]"
                    />
                )}
                {post.media_type === "video" && post.media_href && (
                    <YoutubeVideo url={post.media_href} parentStyling="w-[65vw] h-[40vw] sm:w-[65vw] sm:h-[40vw] md:w-[55vw] md:h-[35vw] lg:w-[45vw] lg:h-[30vw] [&_*]:w-full [&_*]:h-full "/>
                )}
                {post.media_type === "link" && post.media_href && (
                    <a href={post.media_href} target="_blank" rel="noopener noreferrer" className="underline hover:underline cursor-pointer text-gray-700 hover:text-gray-900 break-all">
                        {post.media_href}
                    </a>
                )}
                {post.media_type === "audio" && post.media_href && (
                    <audio src={post.media_href} controls className="w-full rounded-lg bg-gray-100 " />
                )}
            </div>
            <div className="mt-auto flex flex-row cursor-auto">
                {post.writeup && (
                    <Link to={`/post/${post.id}`} className="hover:underline italic cursor-pointer">Read More</Link>
                )}
                {isAuthenticated && (
                    <div className="ml-auto">
                        <button onClick={() => onEdit?.(post.id)} className="pl-[.5vw] pr-[.5vw] hover:underline cursor-pointer">Edit</button>
                        <button onClick={() => onDelete?.(post.id)} className="pl-[0.5vw] pr-[.5vw] hover:underline cursor-pointer">Delete</button>
                    </div>
                )}
            </div>
            
        </section>
    );
}
