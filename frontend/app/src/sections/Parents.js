import React from "react"
import "../sections/css/InfoContent.css"
import YouTube from "@mui/icons-material/YouTube"


export default function Parents() {
    return (
        <div id="container">
            <h1 className="header">Dla Rodzica</h1>
            <h2 className="sub-highlight">Kompendium wiedzy, czyli  <span className="highlight">nasze projekty</span></h2>

            <div className="playlist">
                <h2 className="hashtags">#WyjątkowaKRCH</h2>
                <a href="https://www.youtube.com/@FundacjaWyjatkoweSerca" target="_blank" rel="noopener noreferrer">
                    <YouTube id="icon" />
                </a>
            </div>
            <p className="content">
                Cykl wywiadów i rozmów z lekarzami na temat wrodzonych wad serca u dzieci oraz sposobów ich leczenia.
            </p>

            <div className="playlist">
                <h2 className="hashtags">#WyjątkoweHistorie</h2>
                <a href="https://www.youtube.com/playlist?list=PLvzkx2eUS2vyq9qJ9jClc1ZTOKnjEiJbJ" target="_blank" rel="noopener noreferrer">
                    <YouTube id="icon" />
                </a>
            </div>
            <p className="content">
                Wyjątkowe serduszka tworzą wyjątkowe historie. Opowieści rodziców dzieci z WWS oraz rodziców dzieci z niepełnosprawnością mówiące o ich życiu, codzienności i ścieżce medycznej.
            </p>

            <div className="playlist">
                <h2 className="hashtags">#SerduszkowyPoradnikRehabilitacyjny</h2>
                <a href="https://www.youtube.com/@FundacjaWyjatkoweSerca" target="_blank" rel="noopener noreferrer">
                    <YouTube id="icon" />
                </a>
            </div>
            <p className="content">
                Wideo poradnik z instruktażem o bezpiecznej opiece nad dziećmi przed i po operacji kardiochirurgicznej oraz o codziennej pielęgnacji.
            </p>

            <div className="playlist">
                <h2 className="hashtags">#WyjątkoweRzeczy</h2>
                <a href="https://www.youtube.com/@FundacjaWyjatkoweSerca" target="_blank" rel="noopener noreferrer">
                    <YouTube id="icon" />
                </a>
            </div>
            <p className="content">
                Wszystkie działania, którymi odczarowujemy szpitalną rzeczywistość. Prowadzimy warsztaty dla dzieci, zabawy, rozmowy z rodzicami, wprowadzamy na oddziały projekt #CZYTANIEnaZDROWIE itp.
            </p>


        </div>
    )
}