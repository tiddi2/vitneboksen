import React, { useState, useEffect } from "react";
import queryString from "query-string";
import Testemony from "./components/Testemony/testemony";
import "./App.css";
import ActionShot from "./components/ActionShot/actionShot";

const App = () => {
  const [sharedKey, setSharedKey] = useState(null);
  const [closeTutorial, setCloseTutorial] = useState(false);

  useEffect(() => {
    let parsed = queryString.parse(window.location.search);
    if (parsed?.session) {
      setSharedKey(parsed.session);
    } else {
      setSharedKey(false);
    }
  }, []);

  return (
    <div>
      {sharedKey !== null && sharedKey && <ActionShot />}
      {sharedKey !== null && sharedKey === false && closeTutorial === false && (
        <div
          style={{
            width: "45rem",
            maxWidth: "99vw",
            margin: "auto",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              margin: "1rem",
              fontSize: "3rem",
              textAlign: "center",
            }}
          >
            Vitneboksen
          </h1>
          <h2>Lag ditt eget realityshow</h2>
          <article style={{ marginTop: "2rem" }}>
            <p>Alt du trenger av utstyr er en PC eller Mac med webkamera.</p>
            <strong>Oppsett</strong>
            <ol style={{ textAlign: "left" }}>
              <li>
                <strong>Trykk "-" (bindestrek-tasten) </strong>for å få opp
                kontrollpanelet. (Ikke her, men når du har trykket deg videre
                herfra)
              </li>
              <li>
                Sett <strong>opptakstid og ventetid før og etter opptak</strong>
              </li>
              <li>
                <strong>Fyll inn spørsmålene</strong> som deltakerne skal svare
                på. Disse vil bli vist i samme rekkefølge som du skriver de inn,
                fortsetter fra toppen etter siste spørsmål er vist.
              </li>
              <li>
                Klikk på knappen <strong>Opprett ny vitneboks,</strong> og ta
                vare på vitneboks-ID'en din. Med den kan du koble deg på den
                samme vitneboksen fra flere PCer.
              </li>
              <li>
                Send <strong>delelinken</strong> til deltakerne dine, så de kan
                sende inn egne videoer i tillegg til vitnesbyrdene.
              </li>
              <li>
                <strong>Lukk kontrollpanelet</strong> med bindestrek-tasten. Nå
                er alt klart til å ta imot vitnesbyrd.
              </li>
            </ol>
            <strong>Avpilling</strong>
            <ol style={{ textAlign: "left" }}>
              <li>
                Etter at dine første vitnesbyrd er lastet opp vil du få
                muligheten til å <strong>Laste ned alle filer</strong>. Dette
                vil gi deg en zip-fil med alle vitnesbyrdene dine i separate
                videoer
              </li>
              <li>
                Om du har to eller flere vitnesbyrd kan du også{" "}
                <strong>Generere vitneboksvideo</strong>. Denne knappen slår
                sammen alle vitnesbyrdene sammen til en enkelt videofil, som
                gjør det enda lettere å vise videre. Dette kan ta litt tid, men
                kontrollpanelet vil gi beskjed om når videoen er ferdig.
              </li>
            </ol>
            <strong>Lagring og sletting av data</strong>
            <ol style={{ textAlign: "left" }}>
              <li>
                Alle vitnesbyrd som lastes opp er tilgjengelige og synlige for
                de som har vitneboks-ID'en, så den bør ikke deles med lugubre
                folk man ikke stoler på.
              </li>
              <li>
                Når du er ferdig kan du <strong>Slette vitneboksen</strong> i
                kontrollpanelet. Da slettes alt fra serveren, og det er ingen
                som lenger har tilgang til filene.
              </li>
              <li>
                Videoene blir ikke brukt av noen andre enn de med
                Vitneboks-ID'en, og blir lastet opp i skyen for å automatisk
                kunne legge inn tekst i videofilene og slå de sammen til den
                ferdige Vitneboksvideoen.
              </li>
            </ol>
          </article>
          <button
            onClick={() => setCloseTutorial(true)}
            style={{
              cursor: "pointer",
              padding: "10px 20px",
              fontSize: "16px",
              borderRadius: "10px",
              border: "none",
              color: "#000",
              outline: "none",
              margin: "auto",
            }}
          >
            Jeg skjønner, og er klar.
          </button>
        </div>
      )}
      {sharedKey !== null && sharedKey === false && closeTutorial && (
        <Testemony />
      )}
    </div>
  );
};

export default App;
