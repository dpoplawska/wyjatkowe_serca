import React from "react";
import './css/Main.css';
import HelpUsSide from "./HelpUsSide";
import SocialsSide from "./SocialsSide";
import HeroSection from "./HeroSection";
import WhatWeDo from "./WhatWeDo";
import GetToKnowUs from "./GetToKnowUs";
import Parents from "./Parents";
import HelpUs from "./HelpUs";

export default function Main() {
    return (
        <section className="main">
            <aside className="left-side">
                <HelpUsSide />
            </aside>
            <section className="main-content">
                <HeroSection />
                {/* <WhatWeDo />
                <GetToKnowUs />
                <Parents />
                <HelpUs /> */}
            </section>
            <aside className="right-side">
                <SocialsSide />
            </aside>
        </section>
    );
}
