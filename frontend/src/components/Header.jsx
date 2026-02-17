import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import logo from '/loading-logo.png';


export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setMenuOpen(false);
    }, [location]);

    return (
        <header className="flex flex-row gap-2 border-b items-center top-0 bg-white z-99 p-2 relative cursor-default">
            {/* Logo */}
            <nav>
                <Link to="/">
                    <div className="m-2 flex-shrink-0 min-w-[60px] sm:min-w-[80px] md:min-w-[100px]">
                        <img
                            src={logo}
                            alt="THE JRR LOGO"
                            className="h-[5rem] w-[5rem] spin-slow cursor-pointer object-contain flex-shrink-0"
                        />
                    </div>
                </Link>
            </nav>

            {/* Title */}
            <Link to="/">
                <h1 className="font-heading text-2xl md:text-4xl lg:text-5xl">Jack Rabbit Records</h1>
            </Link>
            {/* Desktop Nav */}
            <nav className="ml-auto mr-[2vw] hidden md:flex flex-row gap-4">
                <Link to="/about">
                    <h2 className="text-l sm:text-xl lg:text-2xl inter-font hover:underline cursor-pointer text-gray-700 hover:text-gray-900">
                        About
                    </h2>
                </Link>
                <Link to="https://soundcloud.com/user-787353840">
                    <h2 className="text-l sm:text-xl lg:text-2xl inter-font hover:underline cursor-pointer text-gray-700 hover:text-gray-900">
                        SoundCloud
                    </h2>
                </Link>
                <Link to="https://www.instagram.com/corbyg_/">
                    <h2 className="text-l sm:text-xl lg:text-2xl inter-font hover:underline cursor-pointer text-gray-700 hover:text-gray-900">
                        Instagram
                    </h2>
                </Link>
            </nav>

            {/* Hamburger Button (mobile only) */}
            <button
                className="ml-auto mr-4 md:hidden text-4xl cursor-pointer"
                onClick={() => setMenuOpen(!menuOpen)}
            >
                {menuOpen ? (
                    <p>&times;</p>
                ) : (
                    <p>&#8801;</p>
                )}
            </button>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="absolute top-[100%] right-0 w-[100%] bg-white/90 border-b border-t border-gray-300 flex flex-col p-4 gap-3 md:hidden">
                    <a href="https://soundcloud.com/user-787353840" target="_blank" rel="noopener noreferrer"
                        onClick={() => setMenuOpen(false)}>
                        <h2 className="text-center text-xl inter-font hover:underline text-gray-700 hover:text-gray-900">
                            SoundCloud
                        </h2>
                    </a>
                    <a href="https://www.instagram.com/corbyg_/" target="_blank" rel="noopener noreferrer"
                        onClick={() => setMenuOpen(false)}>
                        <h2 className="text-center text-xl inter-font hover:underline text-gray-700 hover:text-gray-900">
                            Instagram
                        </h2>
                    </a>
                    <Link to="/about" onClick={() => setMenuOpen(false)}>
                        <h2 className="text-center text-xl inter-font hover:underline text-gray-700 hover:text-gray-900">
                            About
                        </h2>
                    </Link>
                </div>
            )}
        </header>
    );
}
