import React, { useRef, useEffect, useState } from "react"
import "./css/Sides.css"
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function SocialsSide() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [fbWidth, setFbWidth] = useState(0);
    const [postsExpanded, setPostsExpanded] = useState(true);

    useEffect(() => {
        if (containerRef.current) {
            setFbWidth(containerRef.current.offsetWidth);
        }
    }, []);

    const fbSrc = `https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fwyjatkoweserca&tabs=timeline&width=${fbWidth}&height=600&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false`;

    return (
        <section className="socials side">
            <div className="supportUs" >
                Odwiedź Nasze Social Media
            </div>

            <div className="icons">
                <a href="https://www.youtube.com/@FundacjaWyjatkoweSerca" target="_blank" rel="noopener noreferrer">
                    <YouTubeIcon className="icon" />
                </a>
                <a href="https://www.facebook.com/wyjatkoweserca" target="_blank" rel="noopener noreferrer">
                    <FacebookIcon className="icon" />
                </a>
                <a href="https://www.instagram.com/wyjatkoweserca/" target="_blank" rel="noopener noreferrer">
                    <InstagramIcon className="icon" />
                </a>
            </div>

            <div className="supportUs fb-posts-toggle-header" style={{ fontSize: '22px', marginTop: '8px' }}
                onClick={() => setPostsExpanded(e => !e)}>
                Ostatnie posty
                <span className="fb-posts-chevron">
                    {postsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </span>
            </div>

            <div className="fb-posts-embed" ref={containerRef} style={{ display: postsExpanded ? 'flex' : 'none' }}>
                {fbWidth > 0 && (
                    <iframe
                        title="Facebook posts"
                        src={fbSrc}
                        width={fbWidth}
                        height="600"
                        style={{ border: 'none', borderRadius: '8px' }}
                        scrolling="no"
                        frameBorder="0"
                        allowFullScreen={true}
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    />
                )}
            </div>
        </section >
    )
}