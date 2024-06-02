import React, { useState, useEffect, useCallback } from "react";
import {
  deleteSession,
  getOrCreateSession,
  uploadTestemony,
} from "../../Services/vitneboksService";
import "./testemony.css";
import Settings from "../Settings/Settings";
import {
  GetRecordingConstrains,
  downloadFile,
  getSrtFile,
  prepFile,
} from "../../utilities";
import Footer from "../Footer/Footer";

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

const Testemony = () => {
  const [videoStream, setVideoStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [question, setQuestion] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionsRawString, setQuestionsRawString] = useState();
  const [countdown, setCountdown] = useState();
  const [started, setStarted] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [sessionKey, setSessionKey] = useState(
    localStorage.getItem("sessionKey", null)
  );
  const [sharedKey, setSharedKey] = useState(null);
  const [inputKey, setInputKey] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [countdownTime, setCountdownTime] = useState(3000);
  const [recordTime, setRecordTime] = useState(15000);
  const [waitTime, setWaitTime] = useState(30000);
  const [lastUpload, setLastUpload] = useState(null);
  const [testimonialCount, setTestimonialCount] = useState(null);
  const [actionShotCount, setActionShotCount] = useState(null);

  const [concatCompleted, setConcatCompleted] = useState(false);
  const [concatProcessStarted, setConcatProcessStarted] = useState(false);
  const [sessionWaiting, setSessionWaiting] = useState(false);
  const [sessionFetchTime, setSessionFetchTime] = useState(null);

  const GetSession = useCallback(
    async (sessionKey = inputKey) => {
      setSessionWaiting(true);
      if (sessionKey == null) {
        sessionKey = localStorage.getItem("sessionKey");
      }
      if (recording) return;
      var {
        sharingKey: newSharedKey,
        sessionKey: newSessionKey,
        testemonials,
        actionshots,
        lastUpload,
        concatCompleted,
      } = await getOrCreateSession(sessionKey);
      if (newSessionKey) {
        setSessionKey(newSessionKey);
        setLastUpload(lastUpload);
        setActionShotCount(actionshots);
        setTestimonialCount(testemonials);
        setSharedKey(newSharedKey);
        setConcatCompleted(concatCompleted);
        localStorage.setItem("sessionKey", newSessionKey);
        localStorage.setItem("sharedKey", newSharedKey);
        localStorage.setItem("concatProcessStarted", false);
      }
      setSessionWaiting(false);
      setSessionFetchTime(Date.now());
    },
    [inputKey, recording]
  );

  useEffect(() => {
    document.addEventListener("keypress", handleKeyPress);
    setSettingsOpen(true);
  }, []);

  useEffect(() => {
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
    setConcatProcessStarted(
      JSON.parse(localStorage.getItem("concatProcessStarted")) || false
    );

    setQuestionsRawString(
      JSON.parse(localStorage.getItem("questionsRawString")) || ""
    );
    if (sessionKey) {
      GetSession(sessionKey);
    }
  }, [GetSession, sessionKey]);

  useEffect(() => {
    if (videoStream && !recording) {
      videoStream.getTracks().forEach((track) => track.stop());
    }
  }, [recording, videoStream]);

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

          const { blob: srtBlob } = getSrtFile(
            recordTime / 1000,
            currentQuestion
          );

          // Save video
          if (!sessionKey) {
            downloadFile(videoBlob, videoFileName);
            downloadFile(srtBlob, videoFileName.replace("mp4", "srt"));
          } else {
            // upload video
            await uploadTestemony(
              sessionKey,
              videoBlob,
              videoFileName,
              srtBlob,
              videoFileName.replace("mp4", "srt")
            );
            await GetSession(sessionKey);
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

        setTimeout(async () => {
          clearInterval(countdownInterval);
          recorder.stop();
          setRecording(false);
          setWaiting(true);
          videoElement.srcObject = null;
          videoElement.src = null;
          setCountdown(waitTime / 1000);
          setConcatProcessStarted(false);
          localStorage.setItem("concatProcessStarted", false);
          countdownInterval = setInterval(() => {
            setCountdown((prevCountdown) => prevCountdown - 1);
          }, 1000);

          setTimeout(async () => {
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

  const handleKeyPress = async (event) => {
    if (event.key === "-") {
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
      localStorage.clear();
      setSessionKey(null);
      setLastUpload(null);
      setActionShotCount(null);
      setTestimonialCount(null);
    }
  };

  return (
    <div>
      <h1 style={{ margin: "1rem", textAlign: "center" }}>
        {started && !waiting && question}
      </h1>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          margin: "auto",
          width: "80%",
          height: "90%",
          maxWidth: "80rem",
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
              zIndex: 99,
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
              zIndex: 99,
            }}
          >
            {countdown}
          </div>
        )}
        <video
          id="video"
          style={{
            width: "100%",
            maxWidth: "80rem",
            borderRadius: "6px",
            objectFit: "cover",
            transform: "scaleX(-1)",
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
        {!started && sessionKey && (
          <div>
            <h1
              style={{
                margin: "1rem",
                fontSize: "3rem",
                textAlign: "center",
              }}
            >
              VITNEBOKSEN
            </h1>
            <h3>Svar på spørsmålet som dukker opp, dette går fint.</h3>
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
        <Settings
          setQuestionsRawString={setQuestionsRawString}
          defaultQuestions={defaultQuestions}
          setSettingsOpen={setSettingsOpen}
          countdownTime={countdownTime}
          setCountdownTime={setCountdownTime}
          waitTime={waitTime}
          recordTime={recordTime}
          setRecordTime={setRecordTime}
          setWaitTime={setWaitTime}
          questionsRawString={questionsRawString}
          inputKey={inputKey}
          sessionKey={sessionKey}
          GetSession={GetSession}
          setInputKey={setInputKey}
          sessionFetchTime={sessionFetchTime}
          sessionWaiting={sessionWaiting}
          testimonialCount={testimonialCount}
          actionShotCount={actionShotCount}
          lastUpload={lastUpload}
          setConcatProcessStarted={setConcatProcessStarted}
          concatProcessStarted={concatProcessStarted}
          concatCompleted={concatCompleted}
          sharedKey={sharedKey}
          deleteSessionClick={deleteSessionClick}
          setQuestions={setQuestions}
        />
      )}
      <Footer />
    </div>
  );
};

export default Testemony;
