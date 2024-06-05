import './css/Menu.css'
import React, { useState } from "react";
import logo from "./logo_podstawowe.png"

export default function Menu() {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    }

    return (
        <div className="menu">
            <a href="/" title="Strona główna">
                <img src={logo} alt="Logo" className="logo-small" width="100px" height="auto" />
            </a>
            <div className="hamburger" onClick={toggleMenu}>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <ul style={{ display: "none" /* style do usuniecia */ }} className={`container ${menuOpen ? 'active' : ''}`}>
                <li>CO ROBIMY</li>
                <li>POZNAJ NAS</li>
                <li>DLA RODZICA</li>
                <li>KONTAKT</li>
            </ul>
        </div>
    )
}
