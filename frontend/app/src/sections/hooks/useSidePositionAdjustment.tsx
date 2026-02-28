import { useState, useEffect } from "react";

export default function useSidePositionAdjustment() {
    const defaultTop = 18;
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 1024);
    const [isMediumScreen, setIsMediumScreen] = useState(window.innerWidth > 992);
    const [top, setTop] = useState(defaultTop);
    const [buttonBottom, setButtonBottom] = useState(24);

    useEffect(() => {
        const handleResize = () => {
            setIsSmallScreen(window.innerWidth <= 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 992px)');
        const handleScreenSizeChange = (e) => {
            setIsMediumScreen(e.matches);
        };
        mediaQuery.addEventListener('change', handleScreenSizeChange);
        setIsMediumScreen(mediaQuery.matches);
        return () => {
            mediaQuery.removeEventListener('change', handleScreenSizeChange);
        };
    }, []);

    useEffect(() => {
        const adjustSidePositions = () => {
            const footer = document.querySelector('.footer');
            const footerRect = footer && footer.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            if (!footerRect) return;

            const distanceToFooter = footerRect.top - windowHeight;
            setButtonBottom(distanceToFooter < 0 ? 24 - distanceToFooter : 24);

            if (isSmallScreen) return;

            const panel = document.querySelector('#left-side .position-fixed') as HTMLElement;
            const panelHeight = panel ? panel.offsetHeight : 0;
            const defaultTopPx = (defaultTop / 100) * windowHeight;
            const panelBottomPx = defaultTopPx + panelHeight;

            if (panelBottomPx > footerRect.top) {
                const newTopPx = footerRect.top - panelHeight;
                setTop((newTopPx / windowHeight) * 100);
            } else {
                setTop(defaultTop);
            }
        };

        window.addEventListener('scroll', adjustSidePositions);
        window.addEventListener('resize', adjustSidePositions);

        return () => {
            window.removeEventListener('scroll', adjustSidePositions);
            window.removeEventListener('resize', adjustSidePositions);
        };
    }, [isSmallScreen]);

    return { isSmallScreen, isMediumScreen, top, buttonBottom };
}
