import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import logo from '/loading-logo.png';


export default function LoadingOverlay({ show = true }) {
    const [visible, setVisible] = useState(show);

    useEffect(() => {
        if (show) {
            setVisible(true);
        } else {
            // wait for fade-out animation before unmounting
            const timeout = setTimeout(() => setVisible(false), 300);
            return () => clearTimeout(timeout);
        }
    }, [show]);

    if (!visible) return null;

    const overlay = (
        <div
            className={`fixed top-0 left-0 w-screen h-screen flex items-center justify-center bg-white z-[99999] 
                ${show ? "opacity-100" : "opacity-0"}`}
        >
            <img
                src={logo}
                alt="Loading..."
                className="w-[10rem] h-[10rem] spin-slow"
            />
        </div>
    );

    return typeof document !== "undefined"
        ? createPortal(overlay, document.body)
        : overlay;
}
