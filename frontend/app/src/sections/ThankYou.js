import React, { useState, useEffect } from "react";
import "./css/Main.css";
import HelpUsSide from "./HelpUsSide";
import SocialsSide from "./SocialsSide";
import logo from "./logo_podstawowe.png";
import FavoriteIcon from '@mui/icons-material/Favorite';

export default function ThankYou() {
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsSmallScreen(window.innerWidth <= 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <section>
            <section className="main">
                <aside className={`left-side ${isSmallScreen ? 'hide-on-small-screen' : ''}`}>
                    <HelpUsSide />
                </aside>
                <section className="thankyou">
                    <div className="thanks">
                        <p>Dziękujemy za wsparcie<FavoriteIcon fontSize="40px" /></p>
                    </div>
                    <div className="logo">
                        <img src={logo} alt="Logo" width="60%" height="auto" />
                    </div>
                </section>
                <aside className="right-side">
                    <SocialsSide />
                </aside>
            </section>
        </section>
    );
}
