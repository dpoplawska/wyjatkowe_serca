import photo from '../../../media/beneficiaries/WS2-FranciszekGrzyb.JPG';

const FranciszekGrzyb = () => {
    return (
      <>
        <h1 className="header" style={{ display: "flex", justifyContent: "center" }}>Franciszek Grzyb</h1>
            <div className="sub-highlight">blok przedsionkowo-komorowy III*st</div>

            <div style={{ padding: "10px", marginTop: "5px", marginBottom: "20px" }} className="logo">
                <div className="container" style={{ display: "flex", justifyContent: "center", alignContent: "center" }}>

                    <img src={photo} alt="Zdjęcie przedstawiające Franciszka Grzyba" width={"500px"} style={{ borderRadius: "15%" }} />
                </div>
            </div>

            <section className="content" style={{ padding: "10px" }}>
                <p>
                   Franciszek urodził się z wrodzonym blokiem przedsionkowo-komorowym III*st., jest po dwóch operacjach serca.
Ostatnie kontrole kardiologiczne wskazały na powolne rozładowanie baterii i kolejną operację kardiologiczną w
najbliższych miesiącach.
          </p>
          <p>Wysiłkiem rehabilitantów i specjalistów Franio dorównuje rozwojem rówieśnikom. Mimo ograniczeń jakie ma przez
wszczepiony stymulator w powłoki brzuszne, jest radosnym i pogodnym dzieckiem.</p>
              
            </section>

      </>
    )
};

export default FranciszekGrzyb;