import './css/Menu.css'
import { useEffect, useState, useRef } from "react";
import logo from "../media/logo_podstawowe.png";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Squash as Hamburger } from "hamburger-react";
import { Link as ScrollLink } from 'react-scroll';
import { Link } from 'react-router-dom';
import {useClickAway} from 'use-click-away';

type Route = { name: string; to: string | null };

export default function Menu() {
    const location = useLocation();
    const goBackHome = "WRÓĆ NA STRONĘ GŁÓWNĄ";

    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);
    const [isOpen, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            setIsSmallScreen(window.innerWidth < 768);
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    useClickAway(ref, () => setOpen(false));

    let routes: Route[] = [];
    if (location.pathname === '/sklep') {
        routes = [
            { name: 'STRONA GŁÓWNA', to: '/' },
        ];
    } else if (location.pathname.startsWith('/zbiorka')) {
        routes = [
            { name: 'STRONA GŁÓWNA', to: '/' },
            { name: 'NASI PODOPIECZNI', to: null },
        ];
    } else if (location.pathname === '/') {
        routes = [
            { name: 'CO ROBIMY', to: 'whatWeDo' },
            { name: 'POZNAJ NAS', to: 'getToKnowUs' },
            { name: 'DLA RODZICA', to: 'forParents' },
            { name: 'KONTAKT', to: 'footer' },
            { name: 'KUP RATUJKĘ', to: '/sklep' },
            { name: 'NASI PODOPIECZNI', to: "/podopieczni" },
        ];
    } else {
        routes = [
            { name: 'STRONA GŁÓWNA', to: '/' },
        ];
    }

    const handleMenuItemClick = () => {
        setOpen(false);
    };

    const renderRoute = (route: Route) => {
        if (route.to && route.to.startsWith('/')) {
            return (
                <Link
                    to={route.to}
                    className="flex gap-1 text-lg"
                    style={{ textDecoration: "none" }}
                    onClick={handleMenuItemClick}
                >
                    <li className="flex gap-1 text-lg">{route.name}</li>
                </Link>
            );
        }

        if (route.to) {
            return (
                <ScrollLink
                    to={route.to}
                    onClick={handleMenuItemClick}
                >
                    <span className="flex gap-1 text-lg">{route.name}</span>
                </ScrollLink>
            );
        }

        return null;
    }; console.log("DEBUG pathname:", location.pathname);

    return (
        <div className="menu">
            {isSmallScreen ? (
                <div className='smallerScreenMenu'>
                    <a href="/" title="Strona główna">
                        <img src={logo} alt="Logo" className="logo-mobile" width="100px" height="auto" />
                    </a>
                    <div ref={ref} className="lg:hidden">
                        <Hamburger toggled={isOpen} size={30} toggle={setOpen} />
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="fixed left-0 right-0 bottom-0 bg-white z-50 flex items-center justify-center"
                                >
                                    <ul className={`grid gap-2 containerMenu ${isOpen ? 'active' : ''}`}>
                                        {routes.length > 0 ? routes.map((route, idx) => (
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
                                                {renderRoute(route)}
                                            </motion.li>
                                        )) : (
                                            <motion.li
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 260,
                                                    damping: 20,
                                                    delay: 0.2,
                                                }}
                                                key={0}
                                                className="w-full p-[0.08rem] rounded-xl bg-gradient-to-tr from-neutral-800 via-neutral-950 to-neutral-700"
                                            >
                                                <Link to="/" className="flex gap-1 text-lg" style={{ textDecoration: "none" }} onClick={handleMenuItemClick}>
                                                    <li>{goBackHome}</li>
                                                </Link>
                                            </motion.li>
                                        )}
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            ) : (
                <ul className="containerMenu">
                    <a href="/" title="Strona główna">
                        <img src={logo} alt="Logo" className="logo-small" width="100px" height="auto" />
                    </a>
                    {routes.length > 0 ? routes.map((route, idx) => (
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
                            {renderRoute(route)}
                        </motion.li>
                    )) : (
                        <motion.li
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 260,
                                damping: 20,
                                delay: 0.2,
                            }}
                            key={0}
                            className="w-full p-[0.08rem] rounded-xl bg-gradient-to-tr from-neutral-800 via-neutral-950 to-neutral-700"
                        >
                            <Link to="/" className="flex gap-1 text-lg" style={{ textDecoration: "none" }} onClick={handleMenuItemClick}>
                                <li>{goBackHome}</li>
                            </Link>
                        </motion.li>
                    )}
                </ul>
            )}
        </div>
    );
}