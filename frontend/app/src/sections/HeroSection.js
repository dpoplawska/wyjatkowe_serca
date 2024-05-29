import React from "react"
import logo from "./logo_podstawowe.png"


export default function HeroSection() {
    return (
        <>
            <div className="logo">
                <img src={logo} alt="Logo" width="80%" height="auto" />
            </div>
            <div className="buttons" style={{ display: "flex", justifyContent: "center", gap: "10%" }}>
                <button>Dla Rodzica</button>
                <button>Poznaj Nas</button>
            </div>
        </>
    )
}