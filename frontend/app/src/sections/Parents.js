import React from "react"
import "../sections/css/InfoContent.css"
import YouTube from "@mui/icons-material/YouTube"
import { Typography } from "@mui/material";

const Playlist = ({ title, description, link }) => (
    <div>
        <div className="playlist">
            <h2 className="hashtags">{title}</h2>
            <a href={link} target="_blank" rel="noopener noreferrer">
                <YouTube id="icon" />
            </a>
        </div>
        <p className="content">{description}</p>
    </div>
);


export default function Parents() {
    return (
        <div id="container" className="forParents">
            <h1 className="header">Dla Rodzica</h1>
            <h2 className="sub-highlight">
                Kompendium wiedzy, czyli <span className="highlight">nasze projekty</span>
            </h2>

            <Playlist
                title="#WyjątkowaKRCH"
                description="Cykl wywiadów i rozmów z lekarzami na temat wrodzonych wad serca u dzieci oraz sposobów ich leczenia."
                link="https://www.youtube.com/@FundacjaWyjatkoweSerca"
            />
            <Playlist
                title="#WyjątkoweHistorie"
                description="Wyjątkowe serduszka tworzą wyjątkowe historie. Opowieści rodziców dzieci z WWS oraz rodziców dzieci z niepełnosprawnością mówiące o ich życiu, codzienności i ścieżce medycznej."
                link="https://www.youtube.com/playlist?list=PLvzkx2eUS2vyq9qJ9jClc1ZTOKnjEiJbJ"
            />
            <Playlist
                title="#SerduszkowyPoradnikRehabilitacyjny"
                description="Wideo poradnik z instruktażem o bezpiecznej opiece nad dziećmi przed i po operacji kardiochirurgicznej oraz o codziennej pielęgnacji."
                link="https://www.youtube.com/@FundacjaWyjatkoweSerca"
            />
            <Playlist
                title="#WyjątkoweRzeczy"
                description="Wszystkie działania, którymi odczarowujemy szpitalną rzeczywistość. Prowadzimy warsztaty dla dzieci, zabawy, rozmowy z rodzicami, wprowadzamy na oddziały projekt #CZYTANIEnaZDROWIE itp."
                link="https://www.youtube.com/@FundacjaWyjatkoweSerca"
            />
        </div>
    )
}