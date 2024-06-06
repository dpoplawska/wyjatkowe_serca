import React, { useEffect, useState } from "react";
import './css/Main.css';
import HelpUsSide from "./HelpUsSide";
import SocialsSide from "./SocialsSide";
import HeroSection from "./HeroSection";
import WhatWeDo from "./WhatWeDo";
import GetToKnowUs from "./GetToKnowUs";
import Parents from "./Parents";
import HelpUs from "./HelpUs";
import { Drawer, styled } from "@mui/material";
const CenteredAside = styled('aside')({
    height: '80%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
});

export default function Main() {
    const [isMediumScreen, setIsSmallScreen] = useState(window.innerWidth > 1024);
    const [isBigScreen, setIsBigScreen] = useState(window.innerWidth > 1450);
    const [drawerWidth, setDrawerWidth] = useState("200px")
    const [marginWidth, setMarginWidth] = useState("25px")


    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        const mediaQuery2 = window.matchMedia('(min-width: 1550px)');

        const handleScreenSizeChange = (e) => {
            setIsSmallScreen(e.matches);
            setIsBigScreen(e.matches)
        };
        mediaQuery.addEventListener('change', handleScreenSizeChange);
        setIsSmallScreen(mediaQuery.matches);
        setIsSmallScreen(mediaQuery2.matches);

        return () => {
            mediaQuery.removeEventListener('change', handleScreenSizeChange);
        };
    }, [window]);

    useEffect(() => {
        if (isBigScreen) {
            setDrawerWidth("300px");
            setMarginWidth("100px")
        } else {
            setDrawerWidth("200px")
            setMarginWidth("25px")
        }
    }, [isBigScreen, isMediumScreen])


    return (
        <section className="main">
            {isMediumScreen ? (
                <Drawer
                    sx={{
                        width: drawerWidth,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            marginLeft: marginWidth,
                            width: drawerWidth,
                            boxSizing: 'border-box',
                            borderRight: 0,
                        },
                    }}
                    variant="permanent"
                    anchor="left"

                >
                    <CenteredAside className="left-side">
                        <HelpUsSide />
                    </CenteredAside>
                </Drawer>) :
                (<aside className="left-side">
                    <HelpUsSide />
                </aside>
                )}
            <section className="main-content">
                <HeroSection />
                {/* <WhatWeDo />
                <GetToKnowUs />
                <Parents />
                <HelpUs /> */}
            </section>
            {isMediumScreen ? (
                <Drawer
                    sx={{
                        width: drawerWidth, flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            marginRight: marginWidth,
                            width: drawerWidth,
                            boxSizing: 'border-box',
                            borderLeft: 0,
                        },
                    }}
                    variant="permanent"
                    anchor="right"
                >
                    <CenteredAside className="right-side">
                        <SocialsSide />
                    </CenteredAside>
                </Drawer>) :
                (<aside className="right-side">
                    <SocialsSide />
                </aside>
                )}

        </section>
    );
}
