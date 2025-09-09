import photo from '../../../media/beneficiaries/WS5-CecyliaSuchocka.JPG';

const CecyliaSuchocka = () => {
    return (
      <>
        <h1 className="header" style={{ display: "flex", justifyContent: "center" }}>Cecylia Suchocka</h1>
            <div className="sub-highlight">Kardiomiopatia</div>

            <div style={{ padding: "10px", marginTop: "5px", marginBottom: "20px" }} className="logo">
                <div className="container" style={{ display: "flex", justifyContent: "center", alignContent: "center" }}>

                    <img src={photo} alt="Zdjęcie przedstawiające Cecylię Suchocką" width={"500px"} style={{ borderRadius: "15%" }} />
                </div>
            </div>

            <section className="content" style={{ padding: "10px" }}>
                <p>
                  Kiedy Cecylka miała zaledwie 7 miesięcy, wydarzyło się coś, co na zawsze odmieniło nasze
życie - jej maleńkie serduszko nagle się zatrzymało… Lekarze zdiagnozowali u niej ciężką
kardiomiopatię rozstrzeniową. Nasza córeczka była reanimowana przez 45 minut – dzielnie
walczyła o każdy oddech. Jej jedynym ratunkiem był przeszczep serca, który przeszła w
wieku 8 miesięcy. Dzięki temu dostała nową szansę na życie. Od tego dnia wiemy, że mamy
w domu prawdziwą bohaterkę. Nasza córeczka już zawsze będzie musiała przyjmować leki,
i być pod opieką specjalistów.
          </p>
          <p>Cecylka w swoim krótkim życiu przeszła więcej niż niejeden dorosły, ale dziś z każdym
dniem rozwija się, rośnie i cieszy nowym serduszkiem oraz beztroskimi chwilami
dzieciństwa.</p>
              
            </section>

      </>
    )
};

export default CecyliaSuchocka;