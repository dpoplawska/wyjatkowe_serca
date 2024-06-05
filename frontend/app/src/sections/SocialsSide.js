import React from "react"
import "./css/Sides.css"
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';

export default function SocialsSide() {
    return (
        <section className="socials side">
            <div className="supportUs" >
                Odwiedź Nasze Social Media
            </div>

            <div className="icons">
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
        </section >
    )
}