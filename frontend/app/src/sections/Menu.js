import './css/Menu.css'
import React, { useEffect, useState } from "react";
import logo from "./logo_podstawowe.png"


import { useClickAway } from "react-use";
import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Squash as Hamburger } from "hamburger-react";

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
    }, [window]);

    const [isOpen, setOpen] = useState(false);
    const ref = useRef(null);

    useClickAway(ref, () => setOpen(false));

    const routes = ['CO ROBIMY', 'POZNAJ NAS', 'DLA RODZICA', 'KONTAKT']

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
                                                    key={route}
                                                    className="w-full p-[0.08rem] rounded-xl bg-gradient-to-tr from-neutral-800 via-neutral-950 to-neutral-700"
                                                >
                                                    <a
                                                        onClick={() => setOpen((prev) => !prev)}
                                                        className={
                                                            "flex items-center justify-between w-full p-5 rounded-xl bg-neutral-950"
                                                        }
                                                    // href={route.href}
                                                    >
                                                        <span className="flex gap-1 text-lg">{route}</span>
                                                    </a>
                                                </motion.li>
                                            );
                                        })}
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            ) : (<ul className={`container ${menuOpen ? 'active' : ''}`}>
                <a href="/" title="Strona główna">
                    <img src={logo} alt="Logo" className="logo-small" width="100px" height="auto" />
                </a>
                <li>CO ROBIMY</li>
                <li>POZNAJ NAS</li>
                <li>DLA RODZICA</li>
                <li>KONTAKT</li>
            </ul>)
            }

        </div>
    )
}
