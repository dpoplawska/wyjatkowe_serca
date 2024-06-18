import './css/Menu.css'
import React, { useEffect, useState, useRef } from "react";
import logo from "./logo_podstawowe.png";
import { useClickAway } from "react-use";
import { AnimatePresence, motion } from "framer-motion";
import { Squash as Hamburger } from "hamburger-react";
import { Link as ScrollLink, animateScroll as scroll } from 'react-scroll';

export default function Menu() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);
    const [isMediumScreen, setIsMediumScreen] = useState(window.innerWidth > 769);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    }

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const mediaQuery2 = window.matchMedia('(min-width: 769px)');

        const handleScreenSizeChange = (e) => {
            setIsSmallScreen(e.matches);
            setIsMediumScreen(e.matches);
        };
        mediaQuery.addEventListener('change', handleScreenSizeChange);
        setIsSmallScreen(mediaQuery.matches);
        setIsMediumScreen(mediaQuery2.matches);

        return () => {
            mediaQuery.removeEventListener('change', handleScreenSizeChange);
        };
    }, []);

    const [isOpen, setOpen] = useState(false);
    const ref = useRef(null);

    useClickAway(ref, () => setOpen(false));

    const routes = [
        { name: 'CO ROBIMY', to: 'whatWeDo' },
        { name: 'POZNAJ NAS', to: 'getToKnowUs' },
        { name: 'DLA RODZICA', to: 'forParents' },
        { name: 'KONTAKT', to: 'footer' }
    ];

    return (
        <div className="menu">
            {isSmallScreen ? (
                <div className='smallerScreenMenu'>
                    <a href="/" title="Strona główna">
                        <img src={logo} alt="Logo" className="logo-mobile" width="100px" height="auto" />
                    </a>
                    <div ref={ref} className="lg:hidden ">
                        <Hamburger toggled={isOpen} size={30} toggle={setOpen} />
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="fixed left-0 shadow-4xl right-0 bottom-0 bg-white z-50 flex items-center justify-center"
                                >
                                    <ul className={`grid gap-2 container ${isOpen ? 'active' : ''}`}>
                                        {routes.map((route, idx) => {
                                            return (
                                                <motion.li
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 260,
                                                        damping: 20,
                                                        delay: 0.1 + idx / 10,
                                                    }}
                                                    key={route.name}
                                                    className="w-full p-[0.08rem] rounded-xl bg-gradient-to-tr from-neutral-800 via-neutral-950 to-neutral-700"
                                                >
                                                    <ScrollLink
                                                        to={route.to}
                                                        onClick={() => setOpen((prev) => !prev)}
                                                    >
                                                        <span className="flex gap-1 text-lg">{route.name}</span>
                                                    </ScrollLink>
                                                </motion.li>
                                            );
                                        })}
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            ) : (
                <ul className={`container ${menuOpen ? 'active' : ''}`}>
                    <a href="/" title="Strona główna">
                        <img src={logo} alt="Logo" className="logo-small" width="100px" height="auto" />
                    </a>
                    {routes.map((route) => (
                        <li key={route.name}>
                            <ScrollLink
                                to={route.to}
                            >
                                {route.name}
                            </ScrollLink>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
