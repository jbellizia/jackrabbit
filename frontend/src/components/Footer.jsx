// src/components/Header.jsx
import { Link } from "react-router-dom";

export default function Header() {
    return (
        <footer className="flex flex-col border-t gap-3 cursor-default mt-4">
            <nav className="self-center flex flex-row gap-5 mt-2">
                
            </nav>
            <div className="self-center mb-5">
                <p className="text-xs">Site designed by <Link to="https://github.com/jbellizia" className="cursor-pointer hover:underline">James Bellizia</Link></p>
            </div>
        </footer>
    );
}
