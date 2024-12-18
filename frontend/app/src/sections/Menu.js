import './css/Menu.css'
import React, { useEffect, useState, useRef } from "react";
import logo from "../media/logo_podstawowe.png";
import { useClickAway, useLocation } from "react-use";
import { AnimatePresence, motion } from "framer-motion";
import { Squash as Hamburger } from "hamburger-react";
import { Link as ScrollLink, animateScroll as scroll } from 'react-scroll';
import { Link, useNavigate } from 'react-router-dom';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export default function Menu() {

    let routes = [
        { name: 'CO ROBIMY', to: 'whatWeDo' },
        { name: 'POZNAJ NAS', to: 'getToKnowUs' },
        { name: 'DLA RODZICA', to: 'forParents' },
        { name: 'KONTAKT', to: 'footer' },
        { name: 'NASI PODOPIECZNI', to: null },
    ];

    const beneficiaries = [
        { name: 'Hubert Szymborski', to: '/zbiorka/hubert_szymborski' },
    ];

    const goBackHome = "WRÓĆ NA STRONĘ GŁÓWNĄ";

    const [menuOpen, setMenuOpen] = useState(false);
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);
    const [isMediumScreen, setIsMediumScreen] = useState(window.innerWidth > 769);
    const [isOpen, setOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const ref = useRef(null);

    const location = useLocation();
    if (location.pathname !== '/') {
        routes = [
            { name: 'STRONA GŁÓWNA', to: '/' },
            { name: 'NASI PODOPIECZNI', to: null },
        ];
    }

    const handleMenuItemClick = () => {
        setOpen(false);
        setMenuOpen(false);
        setDropdownOpen(false);
    };

    useClickAway(ref, () => setOpen(false));

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

    const ourBeneficieries = (route) => {
        return (
            <>
                {route.name === 'NASI PODOPIECZNI' ? (
                    <div className="dropdownContainer dropdown">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            id="dropDownButton"
                        >
                            {route.name}<KeyboardArrowDownIcon />
                        </button>
                        {dropdownOpen && (
                            <ul className="dropdownMenu">
                                {beneficiaries.map((person) => (
                                    <li key={person.name}>
                                        <Link
                                            to={person.to}
                                            onClick={handleMenuItemClick}
                                            className="beneficiary"
                                        >
                                            {person.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ) : route.to.startsWith('/') ? (
                    <Link
                        to={route.to}
                        className="flex gap-1 text-lg"
                        style={{ textDecoration: "none" }}
                        onClick={handleMenuItemClick}
                    >
                        <li className="flex gap-1 text-lg">{route.name}</li>
                    </Link>
                ) : (
                    <ScrollLink
                        to={route.to}
                        onClick={handleMenuItemClick}
                    >
                        <span className="flex gap-1 text-lg">{route.name}</span>
                    </ScrollLink>
                )
                }
            </>
        )
    }

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
                                    <ul className={`grid gap-2 containerMenu ${isOpen ? 'active' : ''}`}>
                                        {routes.length !== 0 ? routes.map((route, idx) => {
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

                                                    {ourBeneficieries(route)}

                                                </motion.li>
                                            );
                                        }) : (
                                            <motion.li
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 260,
                                                    damping: 20,
                                                    delay: 0.1 + 1 / 10,
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
                <ul className={`containerMenu ${menuOpen ? 'active' : ''}`}>
                    <a href="/" title="Strona główna">
                        <img src={logo} alt="Logo" className="logo-small" width="100px" height="auto" />
                    </a>

                    {routes.length !== 0 ? routes.map((route, idx) => {
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
                                {ourBeneficieries(route)}
                            </motion.li>
                        );
                    }) : (
                        <motion.li
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 260,
                                damping: 20,
                                delay: 0.1 + 1 / 10,
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
