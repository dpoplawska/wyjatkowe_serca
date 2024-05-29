import './css/Menu.css'
import React, { useRef } from "react";
import logo from "./logo_podstawowe.png"

export default function Menu() {
    return (
        <div className="menu" style={{ justifyContent: "center" }}>
            <ul className="container" style={{
                listStyleType: "none", display: "flex", justifyContent: "center", alignItems: "center", gap: "2em"
            }}>
                <li><img src={logo} alt="Logo" width="100px" height="auto" /></li>
                <li>CO ROBIMY</li>
                <li>POZNAJ NAS</li>
                <li>DLA RODZICA</li>
                <li>KONTAKT</li>
            </ul>

        </div>
    )
}