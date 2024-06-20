import React from "react"
import logo from "../media/logo_podstawowe.png"
import "./css/Main.css"


export default function HeroSection() {
    return (
        <section className="hero">
            <div className="logo" >
                <img src={logo} alt="Logo" />
            </div>
        </section>
    )
}