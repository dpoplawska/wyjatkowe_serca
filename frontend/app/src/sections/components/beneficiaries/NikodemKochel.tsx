import photo from '../../../media/beneficiaries/WS7-NikodemKochel.jpeg';

const NikodemKochel = () => {
    return (
      <>
        <h1 className="header" style={{ display: "flex", justifyContent: "center" }}>Nikodem Kochel</h1>
            <div className="sub-highlight">Zespół Fallota</div>

            <div style={{ padding: "10px", marginTop: "5px", marginBottom: "20px" }} className="logo">
                <div className="container" style={{ display: "flex", justifyContent: "center", alignContent: "center" }}>

                    <img src={photo} alt="Zdjęcie przedstawiające Nikodema Kochela" width={"500px"} style={{ borderRadius: "15%" }} />
                </div>
            </div>

            <section className="content" style={{ padding: "10px" }}>
                <p>
                   Nasz mały wojownik - Nikoś
                </p>
              
          <p>O wadzie serduszka naszego synka dowiedzieliśmy się już w 20. tygodniu ciąży. Lekarz
wtedy wypowiedział słowa, które na zawsze zmieniły nasze życie: <b>zespół Fallota</b>. Od tamtej
            chwili wiedzieliśmy, że czeka nas trudna droga.</p>
          <p>21 sierpnia 2024 roku na świat przyszedł Nikoś - chłopczyk o ogromnej sile w maleńkim
ciele. Urodził się z kilkoma wadami serca: brakiem przegrody między komorami, zwężeniem
pnia i gałęzi płucnych, tzw. „aortą jeźdźcem” oraz przerostem prawej komory. Początek jego
życia to intensywna walka - pierwsze dwa tygodnie spędził w szpitalu, gdzie dzielnie znosił
            wszystkie badania i procedury.</p>
          
          <p>4 lutego 2025 roku odbyła się wyczekiwana operacja serduszka. Trwała aż siedem godzin! To
był moment ogromnego stresu, ale i nadziei. Niestety, pojawiły się też nowe wyzwania -
wykryto dodatkową wadę serca, podejrzenie problemów z nerkami, a po operacji Nikoś
            przeszedł sepsę i ciężkie zapalenie płuc. Szpital opuściliśmy dopiero po trzech tygodniach…</p>
          <p>Dziś Nikoś wciąż potrzebuje stałej opieki kardiologów, regularnej rehabilitacji i leków.
Zmaga się z problemami po długiej intubacji, a w przyszłości być może czeka go jeszcze

jedna operacja. Mimo to nasz synek każdego dnia pokazuje nam, czym jest siła i odwaga –
            uśmiecha się, walczy i uczy nas, że nadzieja nigdy nie gaśnie.</p>
          <p>Chcemy dać Nikośkowi jak najlepszą opiekę i szansę na zdrowie, ale koszty leczenia i
rehabilitacji są ogromne. Dlatego zwracamy się do Was z prośbą o wsparcie. Każda złotówka,
            każdy gest, to cegiełka w budowaniu przyszłości naszego synka.</p>
          <p>Z całego serca dziękujemy za pomoc i za to, że jesteście z nami w tej drodze!</p>
          <p>Mama i Tata Nikosia</p>
            </section>
      </>
    )
};

export default NikodemKochel;