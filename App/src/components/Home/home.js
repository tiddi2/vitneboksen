import React, { useState, useEffect } from "react";
import {
  deleteSession,
  getSession,
  uploadTestemony,
} from "../../Services/vitneboksService";
import "./home.css";
import { GetRecordingConstrains, downoadFile, prepFile } from "../../utilities";

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
  const [lastUpload, setLastUpload] = useState(null);
  const [videoCount, setVideoCount] = useState(null);

  const GetSession = async (sessionKey = inputKey) => {
    var {
      sharingKey: newSharedKey,
      sessionKey: newSessionKey,
      videoCount,
      lastUpload,
    } = await getSession(sessionKey);
    if (newSessionKey) {
      setSharedKey(newSharedKey);
      setSessionKey(newSessionKey);
      setLastUpload(lastUpload);
      setVideoCount(videoCount);
      localStorage.setItem("sessionKey", newSessionKey);
      localStorage.setItem("sharedKey", newSharedKey);
    }
  };

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
    setRecordTime(JSON.parse(localStorage.getItem("recordTime")) || 5000);
    setWaitTime(JSON.parse(localStorage.getItem("waitTime")) || 30000);
    setQuestionsRawString(
      JSON.parse(localStorage.getItem("questionsRawString")) || ""
    );
    const session = localStorage.getItem("sessionKey") || null;
    if (session) {
      getSession(session).then(
        ({
          sharingKey: newSharedKey,
          sessionKey: newSessionKey,
          videoCount,
          lastUpload,
        }) => {
          setSharedKey(newSharedKey);
          setSessionKey(newSessionKey);
          setLastUpload(lastUpload);
          setVideoCount(videoCount);
        }
      );
    }
  }, []);

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

        const stream = await navigator.mediaDevices.getUserMedia(
          await GetRecordingConstrains()
        );
        setVideoStream(stream);

        const recorder = new MediaRecorder(stream);

        const recordedChunks = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const { blob: videoBlob, fileName: videoFileName } = prepFile(
            recordedChunks,
            "mp4"
          );
          const srtContent = [
            `1\n00:00:00,000 --> 00:00:10,000\n${currentQuestion}`,
          ];
          const { blob: srtBlob, fileName: srtFileName } = prepFile(
            srtContent,
            "srt"
          );

          // Save video
          if (!sessionKey) {
            downoadFile(videoBlob, videoFileName);
            downoadFile(srtBlob, srtFileName);
          } else {
            // upload video
            await uploadTestemony(
              sessionKey,
              videoBlob,
              videoFileName,
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

  const handleKeyPress = (event) => {
    if (event.key === "|") {
      setSettingsOpen((prev) => !prev);
    }
  };

  const deleteSessionClick = async () => {
    if (
      window.confirm(
        "Er du sikker på at du vil slette Vitneboksen? Det kan ikke angres"
      )
    ) {
      await deleteSession(sessionKey);
      setSessionKey(null);
      setSharedKey(null);
      setLastUpload(null);
      setVideoCount(null);
      localStorage.clear();
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
          textAlign: "center",
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
            padding: "0.5rem 1rem",
            justifyItems: "flex-end",
            borderRadius: "10px",
            zIndex: 5,
          }}
        >
          <h3>Konfigurasjon</h3>
          <label>
            <span>Ventetid før opptak:</span>
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
          <label>
            <span>Opptakstid:</span>
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
          <label>
            <span>Ventetid etter opptak:</span>
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
          <span>Spørsmål (ett per linje)</span>
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
              <span>Opprett ny vitneboks:</span>
              <div>
                <input
                  type="text"
                  style={{ width: "5rem" }}
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                />
                <button onClick={() => GetSession()}>Opprett</button>
              </div>
            </label>
          ) : (
            <div>
              <h3>Tilkobling</h3>
              <label>
                <span>Antall vitnesbyrd:</span>
                <div>
                  {videoCount || 0}
                  &nbsp; &nbsp;
                  <a
                    style={{ width: "4rem" }}
                    className="button"
                    href={`${process.env.REACT_APP_API}download-session-files?sessionKey=${sessionKey}`}
                  >
                    Last ned
                  </a>
                </div>
                <div>
                  <a
                    style={{ width: "4rem" }}
                    className="button"
                    href={`${process.env.REACT_APP_API}download-concatenated-video?sessionKey=${sessionKey}`}
                  >
                    Last ned hele
                  </a>
                </div>
              </label>
              <label>
                Vitneboks-ID:
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
              {lastUpload && (
                <label>
                  Siste opplasting:
                  <span>{new Date(lastUpload).toLocaleString()}</span>
                </label>
              )}

              <div>
                <button className="red" onClick={deleteSessionClick}>
                  Slett vitneboks
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <div
        className="footer"
        style={{
          position: "fixed",
          display: "flex",
          alignItems: "baseline",
          bottom: "0",
          left: "5%",
          right: "5%",
        }}
      >
        <p
          style={{
            bottom: "0",
            left: "5%",
            alignItems: "baseline",
            alignContent: "baseline",
          }}
        >
          Sponset av
          <a style={{ margin: "0 5px" }} href="https://spritjakt.no">
            <img
              src="spritjakt.png"
              alt="spritjakt logo"
              style={{ margin: "5px" }}
              height={"25px"}
            />
          </a>
          og
          <a
            style={{ margin: "0 5px" }}
            href="https://erdetfesthosmatsikveld.no"
          >
            erdetfesthosmatsikveld.no
          </a>
        </p>
        <p
          style={{
            right: "0%",
            left: "0%",
            bottom: "0",
            marginLeft: "auto",
            marginRight: "auto",
            alignItems: "baseline",
            alignContent: "baseline",
            gap: "10px",
          }}
        >
          © 2024{" "}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://no.linkedin.com/in/mats-l%C3%B8vstrand-berntsen-4682b2142"
          >
            Mats Løvstrand Berntsen
          </a>
        </p>
        <p
          style={{
            display: "flex",
            bottom: "0",
            right: "5%",
            alignItems: "baseline",
            alignContent: "baseline",
            gap: "10px",
          }}
        >
          Kildekoden finner du på
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/matslb/vitneboksen"
          >
            Github
          </a>
        </p>
      </div>
    </div>
  );
};

export default Home;
