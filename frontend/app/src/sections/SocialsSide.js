import React from "react"
import "./css/Sides.css"
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';

export default function SocialsSide() {
    return (
        <section className="socials side">
            <div style={{ fontFamily: "Quicksand", fontSize: "30px", color: "#EC1A3B" }}>
                Odwiedź Nasze Social Media
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <a href="https://www.youtube.com/@FundacjaWyjatkoweSerca" target="_blank" rel="noopener noreferrer">
                    <YouTubeIcon style={{ fontSize: "50px", color: "#000" }} />
                </a>
                <a href="https://www.facebook.com/wyjatkoweserca" target="_blank" rel="noopener noreferrer">
                    <FacebookIcon style={{ fontSize: "50px", color: "#000" }} />
                </a>
                <a href="https://www.instagram.com/wyjatkoweserca/" target="_blank" rel="noopener noreferrer">
                    <InstagramIcon style={{ fontSize: "50px", color: "#000" }} />
                </a>
            </div>
        </section>
    )
}