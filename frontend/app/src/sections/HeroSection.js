import React from "react"
import logo from "./logo_podstawowe.png"
import "./css/Main.css"


export default function HeroSection() {
    return (
        <section className="hero">
            <div className="logo" >
                <img src={logo} alt="Logo" />
            </div>
            <div className="buttons" style={{ display: "none" /* do zmiany na flex */, justifyContent: "center", gap: "10%" }}>
                <button>Dla Rodzica</button>
                <button>Poznaj Nas</button>
            </div>
        </section>
    )
}