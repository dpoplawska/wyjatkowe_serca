import photo from '../../../media/beneficiaries/WS1-DanusiaGrzyb.JPG';

const DanusiaGrzyb = () => {
    return (
      <>
        <h1 className="header" style={{ display: "flex", justifyContent: "center" }}>Danusia Grzyb</h1>
            <div className="sub-highlight">Kardiomiopatia, blok przedsionkowo-komorowy III*st</div>

            <div style={{ padding: "10px", marginTop: "5px", marginBottom: "20px" }} className="logo">
                <div className="container" style={{ display: "flex", justifyContent: "center", alignContent: "center" }}>
                    <img src={photo} alt="Zdjęcie przedstawiające Danusię Grzyb" width={"500px"} style={{ borderRadius: "15%" }} />
                </div>
            </div>

            <section className="content" style={{ padding: "10px" }}>
                <p>
                   Danusia urodziła się w 30 tygodniu ciąży, w lipcu 2020r, jako skrajny wcześniak. Przyszła na świat przez cesarskie cięcie i natychmiast przeszła operację wszczepienia stymulatora serca. Powiększona komora nie była powikłaniem po obciążeniu przez blok przedsionkowo-komorowy III*st, w późniejszym czasie dostaliśmy diagnozę - kardiomiopatia.
                </p>
                <p>
                   Serce obciążone przez blok i kardiomiopatię, nie pozwoliło na prawidłowy rozwój Danusi. Po mimo zażywania leków, kontroli lekarskich, jej stan nie ulegał znaczącej poprawie. Mimo nadziei jaką dała operacja wymiany układu stymulującego (tzw. rozrusznika), szybko okazało się, że była to złudna nadzieja. Pół roku po operacji, stan córki pogorszył się na tyle że nie opuściła już po kontroli szpitalnej izolatki. Pozostałyśmy w szpitalu siedem miesięcy, oczekując na pilnej liście do transplantacji serca. Po udanej transplantacji serca w wakacje 2023r, rozwój Danusi bardzo przyśpieszył.
                </p>
                <p>
                  Pozostaje nadal pod kontrolą specjalistów, starając się zminimalizować skutki immunosupresji, powikłań po przeszczepowych i żyć jak najlepiej zdobywając czas do następnej transplantacji.
                </p>
          
            </section>

      </>
    )
};

export default DanusiaGrzyb;