import React, { useState, useEffect } from "react";
import "./App.css"; // Import the CSS file

const questions = [
  "Hvordan føler du deg i dag etter dagens hendelser?",
  "Hvem stoler du mest på i huset/feriestedet, og hvorfor?",
  "Hva synes du om de siste konfliktene eller diskusjonene som har oppstått?",
  "Hvordan håndterte du dagens utfordringer eller oppgaver?",
  "Er det noen spesiell person du føler deg nærmere nå sammenlignet med tidligere?",
  "Hvem i gruppen tror du er den største konkurrenten din, og hvorfor?",
  "Har du noen strategier for å komme lenger i konkurransen/få en partner?",
  "Hvordan takler du stress eller presset fra å være i en konstant overvåket situasjon?",
  "Hvordan har opplevelsen så langt påvirket dine personlige relasjoner og vennskap i gruppen?",
  "Hva er din største frykt eller bekymring for tiden?",
  "Hvordan tror du andre deltakere oppfatter deg, og er det noe du ønsker å endre ved det?",
  "Er det noen romantiske følelser som utvikler seg mellom deg og andre deltakere?",
  "Hvordan har du tilpasset deg livet i huset/feriestedet sammenlignet med dine forventninger før du kom hit?",
  "Hvem synes du har endret seg mest siden starten av programmet, og hvorfor?",
  "Hva savner du mest fra livet utenfor realityprogrammet?",
  "Hvordan takler du følelsen av isolasjon eller mangel på personvern?",
  "Er det noen personlige mål eller opplevelser du ønsker å oppnå mens du er her?",
  "Hvordan påvirker konkurransen din oppfatning av andre deltakere?",
  "Hvilke personlige egenskaper tror du gjør deg til en sterk konkurrent i dette spillet?",
  "Hvordan tror du du vil se tilbake på denne opplevelsen når den er over?",
];

const App = () => {
  const [videoStream, setVideoStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recording, setRecording] = useState(false);
  const [question, setQuestion] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    return () => {
      // Cleanup when the component unmounts
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoStream]);

  const startRecording = async () => {
    setStarted(true);
    try {
      const countdownInterval = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);

      let question = questions[Math.floor(Math.random() * questions.length)];
      setQuestion(question);

      setTimeout(async () => {
        clearInterval(countdownInterval);
        const constraints = { video: true, audio: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setVideoStream(stream);

        const recorder = new MediaRecorder(stream);
        const recordedChunks = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: "video/mp4" });

          // Generate file name based on current date and time
          const now = new Date();
          const fileName = `confession_${now
            .toISOString()
            .replace(/[:.]/g, "-")}.mp4`;

          // Save video
          saveBlobAsFile(blob, fileName);

          // Generate and save SRT file
          const srtContent = `1\n00:00:00,000 --> 00:00:10,000\n${question}`;

          const srtBlob = new Blob([srtContent], { type: "text/srt" });
          const srtFileName = `confession_${now
            .toISOString()
            .replace(/[:.]/g, "-")}.srt`;

          saveBlobAsFile(srtBlob, srtFileName);

          if (videoStream) {
            videoStream.getTracks().forEach((track) => track.stop());
          }
          setQuestion(null);
          setCountdown(10);
        };

        setMediaRecorder(recorder);

        // Assign the stream to the video element
        const videoElement = document.getElementById("video");
        if ("srcObject" in videoElement) {
          videoElement.srcObject = stream;
        } else {
          // For older browsers that don't support srcObject
          videoElement.src = URL.createObjectURL(stream);
        }

        // Mute the video
        videoElement.muted = true;

        recorder.start();

        setRecording(true);

        setTimeout(() => {
          recorder.stop();
          setRecording(false);
          videoElement.srcObject = null;
          setStarted(false);
        }, 15000); // Record for 15 seconds
      }, 10000); // Wait for 10 seconds
    } catch (error) {
      console.error("Error accessing webcam:", error);
    }
  };

  // Function to save Blob as a file
  const saveBlobAsFile = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        position: "fixed",
      }}
    >
      <h1 style={{ margin: "1rem", textAlign: "center" }}>
        {question || "VITNEBOKSEN"}
      </h1>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          margin: "auto",
          width: "80%",
          height: "90%", // Adjusted height to make space for buttons
        }}
      >
        <div
          style={{
            position: "fixed",
            display: "flex",
            bottom: "0",
            alignItems: "baseline",
            alignContent: "baseline",
            gap: "10px",
          }}
        >
          <h3>Sponset av</h3>
          <img src="spritjakt.png" height={"30px"} />
          <h3>og</h3>
          <a href="https://erdetfesthosmatsikveld.no">
            erdetfesthosmatsikveld.no
          </a>
        </div>

        {recording && (
          <div
            style={{
              position: "absolute",
              top: "2%",
              left: "2%",
              fontSize: "2rem",
              display: "flex",
              background: "rgba(0,0,0,0.3)",
              padding: "1rem",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                padding: "2px",
                borderRadius: "50%",
                backgroundColor: "red",
                animation: "blinker 1s infinite",
                zIndex: 3, // Higher zIndex to ensure it's on top
              }}
            />
            <div style={{ color: "white" }}>REC</div>
          </div>
        )}
        <video
          id="video"
          style={{
            width: "99%",
            height: "94%",
            borderRadius: "6px",
            objectFit: "cover",
          }}
          autoPlay
        />
      </div>

      <div
        style={{
          position: "fixed",
          bottom: "50%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2, // Higher zIndex to ensure it's on top of the video
        }}
      >
        {started && countdown > 0 && (
          <div
            style={{
              position: "absolute",
              top: "40%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "48px",
              color: "#fff",
              zIndex: 4, // Higher zIndex to ensure it's on top of the video
            }}
          >
            {countdown}
          </div>
        )}
        {!started && (
          <div>
            <h3>Svar så ærlig du kan på spørsmålet som kommer</h3>
            <button
              onClick={startRecording}
              style={{
                cursor: "pointer",
                padding: "10px 20px",
                fontSize: "16px",
                borderRadius: "10px",
                border: "none",
                color: "#000",
                outline: "none",
              }}
            >
              {"Jeg er klar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
