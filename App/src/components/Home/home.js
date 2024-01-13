import React, { useState, useEffect } from "react";
import {
  createSession,
  uploadTestemony,
} from "../../Services/vitneboksService";
import "./home.css";
import { GetVideoConfig } from "../../Services/mediaService";

const defaultQuestions = [
  "Hvordan føler du deg i dag etter dagens hendelser?",
  "Hvem stoler du mest på i huset/feriestedet, og hvorfor?",
  "Hva synes du om de siste konfliktene eller diskusjonene som har oppstått?",
  "Hvordan håndterte du dagens utfordringer eller oppgaver?",
  "Er det noen spesiell person du føler deg nærmere nå sammenlignet med tidligere?",
  "Hvem i gruppen tror du er den største konkurrenten din, og hvorfor?",
  "Har du noen strategier for å komme lenger i konkurransen/få en partner?",
  "Hvordan har opplevelsen så langt påvirket dine personlige relasjoner og vennskap i gruppen?",
  "Hva er din største frykt eller bekymring for tiden?",
  "Hvem synes du har endret seg mest siden starten av programmet, og hvorfor?",
  "Hva savner du mest fra livet utenfor realityprogrammet?",
  "Hvordan takler du følelsen av isolasjon eller mangel på personvern?",
  "Er det noen personlige mål eller opplevelser du ønsker å oppnå mens du er her?",
  "Hvordan påvirker konkurransen din oppfatning av andre deltakere?",
  "Hvordan tror du du vil se tilbake på denne opplevelsen når den er over?",
];

const Home = () => {
  const [videoStream, setVideoStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [question, setQuestion] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionsRawString, setQuestionsRawString] = useState();
  const [countdown, setCountdown] = useState();
  const [started, setStarted] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [sessionKey, setSessionKey] = useState(null);
  const [sharedKey, setSharedKey] = useState(null);
  const [inputKey, setInputKey] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [countdownTime, setCountdownTime] = useState(3000);
  const [recordTime, setRecordTime] = useState(15000);
  const [waitTime, setWaitTime] = useState(30000);

  useEffect(() => {
    document.addEventListener("keypress", handleKeyPress);
    const customQuestions = JSON.parse(localStorage.getItem("questions"));
    setQuestions(
      customQuestions === undefined ||
        customQuestions === null ||
        customQuestions?.length === 0
        ? defaultQuestions
        : customQuestions
    );
    setCountdownTime(JSON.parse(localStorage.getItem("countdownTime")) || 3000);
    setRecordTime(JSON.parse(localStorage.getItem("recordTime")) || 15000);
    setWaitTime(JSON.parse(localStorage.getItem("waitTime")) || 30000);
    setQuestionsRawString(
      JSON.parse(localStorage.getItem("questionsRawString")) || ""
    );
    setSessionKey(localStorage.getItem("sessionKey") || null);
    setSharedKey(localStorage.getItem("sharedKey") || null);
  }, []);

  const CreateSession = async () => {
    var { newSharedKey, newSessionKey } = await createSession(inputKey);
    if (newSessionKey) {
      setSharedKey(newSharedKey);
      setSessionKey(newSessionKey);
      localStorage.setItem("sessionKey", newSessionKey);
      localStorage.setItem("sharedKey", newSharedKey);
    }
  };

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
    setCountdown(countdownTime / 1000);
    try {
      let countdownInterval = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);

      let currentQuestion =
        questions[(questions.indexOf(question) || 0) + 1] || questions[0];
      setQuestion(currentQuestion);
      setTimeout(async () => {
        clearInterval(countdownInterval);
        const constraints = {
          video: true,
          audio: true,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setVideoStream(stream);

        const recorder = new MediaRecorder(stream, {
          mimeType: "video/webm",
        });

        const recordedChunks = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const videoBlob = new Blob(recordedChunks, {
            type: "video/webm",
          });

          // Generate file name based on current date and time
          const now = new Date();
          const fileName = `vitneboksen_${now
            .toISOString()
            .replace(/[:.]/g, "-")}.webm`;

          // Generate and save SRT file
          const srtContent = `1\n00:00:00,000 --> 00:00:10,000\n${currentQuestion}`;

          const srtBlob = new Blob([srtContent], { type: "text/srt" });
          const srtFileName = `vitneboksen_${now
            .toISOString()
            .replace(/[:.]/g, "-")}.srt`;

          // Save video
          if (!sessionKey) {
            saveBlobAsFile(videoBlob, fileName);
            saveBlobAsFile(srtBlob, srtFileName);
          } else {
            // upload vide
            await uploadTestemony(
              sessionKey,
              videoBlob,
              fileName,
              srtBlob,
              srtFileName
            );
          }

          if (videoStream) {
            videoStream.getTracks().forEach((track) => track.stop());
          }
        };

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
        setCountdown(recordTime / 1000);

        countdownInterval = setInterval(() => {
          setCountdown((prevCountdown) => prevCountdown - 1);
        }, 1000);

        setTimeout(() => {
          clearInterval(countdownInterval);
          recorder.stop();
          setRecording(false);
          setWaiting(true);
          videoElement.srcObject = null;

          setCountdown(waitTime / 1000);

          countdownInterval = setInterval(() => {
            setCountdown((prevCountdown) => prevCountdown - 1);
          }, 1000);

          setTimeout(() => {
            clearInterval(countdownInterval);
            setWaiting(false);
            setStarted(false);
          }, waitTime); //wait
        }, recordTime); // Record
      }, countdownTime); // Countdown
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

  const handleKeyPress = (event) => {
    if (event.key === "|") {
      setSettingsOpen((prev) => !prev);
    }
  };

  const handleTextareaChange = (event) => {
    const inputString = event.target.value;
    const newArray = parseNewlineSeparatedList(inputString);
    if (newArray.length > 0) {
      setQuestions(newArray);
    } else {
      setQuestions(defaultQuestions);
    }

    localStorage.setItem("questions", JSON.stringify(newArray));
    setQuestionsRawString(inputString);
    localStorage.setItem("questionsRawString", JSON.stringify(inputString));
  };

  const parseNewlineSeparatedList = (inputString) => {
    const arrayOfStrings = inputString.split("\n");
    const trimmedArray = arrayOfStrings
      ?.map((str) => str.trim())
      .filter((str) => str !== "");
    console.log(trimmedArray);
    return trimmedArray;
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
        {started && !waiting && question}
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
        {recording && countdown > 0 && (
          <div
            style={{
              position: "absolute",
              top: "2%",
              right: "2%",
              fontSize: "2rem",
              display: "flex",
              background: "rgba(0,0,0,0.3)",
              padding: "1rem",
            }}
          >
            {countdown}
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
        {started && !waiting && !recording && countdown > 0 && (
          <div
            style={{
              position: "absolute",
              top: "40%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "1.6rem",
              width: "30rem",
              color: "#fff",
              zIndex: 4, // Higher zIndex to ensure it's on top of the video
            }}
          >
            Opptaket starter om {countdown} sekunder
          </div>
        )}
        {!started && (
          <div>
            <h3>Velkommen til</h3>
            <h1
              style={{
                margin: "1rem",
                fontSize: "3rem",
                textAlign: "center",
              }}
            >
              Vitneboksen
            </h1>
            <h3>
              Svar på spørsmålet som dukker opp, og husk at ærlighet varer
              lengst
            </h3>
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
        {waiting && (
          <div
            style={{
              position: "absolute",
              top: "40%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "1.6rem",
              width: "30rem",
              color: "#fff",
              zIndex: 4, // Higher zIndex to ensure it's on top of the video
            }}
          >
            <h2>Takk for ditt bidrag</h2>
            <br />
            Vitneboksen åpner igjen om {countdown} sekunder
          </div>
        )}
      </div>

      {settingsOpen && (
        <div
          className="settings"
          style={{
            position: "fixed",
            top: "5%",
            right: "5%",
            width: "20rem",
            background: "rgba(25, 25, 25, 1)",
            boxShadow: "1px 1px 4px black",
            padding: "20px",
            borderRadius: "10px",
            display: "flex",
            gap: ".5rem",
            alignItems: "baseLine",
            flexDirection: "column",
            zIndex: 5,
          }}
        >
          <label>
            Ventetid før opptak:
            <input
              type="number"
              value={countdownTime / 1000}
              onChange={(e) => {
                let value = parseInt(e.target.value, 10) * 1000;
                setCountdownTime(value);
                localStorage.setItem("countdownTime", value);
              }}
            />
          </label>
          <br />
          <label>
            Opptakstid:
            <input
              type="number"
              value={recordTime / 1000}
              onChange={(e) => {
                let value = parseInt(e.target.value, 10) * 1000;
                setRecordTime(value);
                localStorage.setItem("recordTime", value);
              }}
            />
          </label>
          <br />
          <label>
            Ventetid etter opptak:
            <input
              type="number"
              value={waitTime / 1000}
              onChange={(e) => {
                let value = parseInt(e.target.value, 10) * 1000;
                setWaitTime(value);
                localStorage.setItem("waitTime", value);
              }}
            />
          </label>
          <br />
          Spørsmål (ett per linje)
          <textarea
            onChange={handleTextareaChange}
            value={questionsRawString}
            style={{
              width: "100%",
              minHeight: "5rem",
              color: "black",
              textAlign: "left",
            }}
          />
          {sessionKey == null ? (
            <label>
              Start ny session:
              <div>
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                />
                <button onClick={CreateSession}>Opprett</button>
              </div>
            </label>
          ) : (
            <div>
              <label>
                Aktiv session:
                <input type="text" value={sessionKey} disabled={true} />
              </label>
              <label>
                Link til deling:
                <input
                  type="text"
                  value={`${window.location}?session=${sharedKey}`}
                  disabled={true}
                />
              </label>
              <label>
                Videoer:
                <a
                  href={`https://vitneboksenfunc20240113125528.azurewebsites.net/api/download-session-files?sessionKey=${sessionKey}`}
                >
                  Last ned
                </a>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
