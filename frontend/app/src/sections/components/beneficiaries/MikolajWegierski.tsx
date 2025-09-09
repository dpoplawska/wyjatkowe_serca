import photo from '../../../media/beneficiaries/WS4-MikolajWegierski.JPG';

const MikolajWegierski = () => {
    return (
      <>
        <h1 className="header" style={{ display: "flex", justifyContent: "center" }}>Mikołaj Węgierski</h1>
            <div className="sub-highlight">Kardiomiopatia</div>

            <div style={{ padding: "10px", marginTop: "5px", marginBottom: "20px" }} className="logo">
                <div className="container" style={{ display: "flex", justifyContent: "center", alignContent: "center" }}>

                    <img src={photo} alt="Zdjęcie przedstawiające Mikołaja Węgierskiego" width={"500px"} style={{ borderRadius: "15%" }} />
                </div>
            </div>

            <section className="content" style={{ padding: "10px" }}>
                <p>
                   Mikuś to pełen życia, uśmiechnięty 2-letni chłopiec, który każdego dnia pokazuje, jak
ogromną ma wolę walki. Za sobą ma już więcej niż niejeden dorosły - spędził w szpitalu
ponad 519 dni.
          </p>
          <p>Do szpitala trafił w wieku zaledwie 8 miesięcy z rozpoznaniem kardiomiopatii
rozstrzeniowej - poważnej choroby serca. Po nieskutecznych interwencjach
kardiochirurgicznych okazało się, że jedyną szansą na życie dla Mikołaja był przeszczep serca.
Jednak jego serduszko było za słabe, dlatego lekarze wszczepili mu sztuczną komorę Berlin
            Heart, która pomagała mu żyć aż przez 10 miesięcy.</p>
          <p>W końcu stał się cud - Mikuś otrzymał największy dar - dar życia, nowe serce. Dziś jest już w
domu i z radością czerpie z życia pełnymi garściami. Zaraża swoim uśmiechem, optymizmem
i pokazuje nam wszystkim, jak wielką na siłę.
Jednak to dopiero początek kolejnej, trudnej drogi.
Po przeszczepie Mikuś wymaga: intensywnej rehabilitacji oraz regularnej opieki wielu
            specjalistów.</p>
          
          <p>To niezbędne, aby mógł odzyskać pełną sprawność, nauczyć się biegać i wreszcie dogonić
            swoich rówieśników. Niestety, koszty związane z leczeniem i rehabilitacją są ogromne.</p>
          <p>Dlatego jeśli chcecie pomóc i wesprzeć Mikusia w walce o powrót do sprawności. Każda,
nawet najmniejsza wpłata, to krok bliżej do tego, aby mógł cieszyć się dzieciństwem takim,
na jakie zasługuje.
          </p>
          <p>Z całego serca dziękujemy za każdą pomoc!
          </p>
          <p>Rodzice</p>
              
            </section>

      </>
    )
};

export default MikolajWegierski;