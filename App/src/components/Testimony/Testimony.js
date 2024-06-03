import React, { useState, useEffect, useCallback } from "react";
import {
  deleteSession,
  getOrCreateSession,
  uploadTestimony,
} from "../../Services/vitneboksService";
import "./Testimony.css";
import Settings from "../Settings/Settings";
import {
  GetRecordingConstrains,
  downloadFile,
  getSrtFile,
  prepFile,
  defaultQuestions,
} from "../../utilities";
import Footer from "../Footer/Footer";

const Testimony = () => {
  const [videoStream, setVideoStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [question, setQuestion] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [countdown, setCountdown] = useState();
  const [started, setStarted] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [sessionKey, setSessionKey] = useState(
    localStorage.getItem("sessionKey", null)
  );
  const [sharedKey, setSharedKey] = useState(null);
  const [inputKey, setInputKey] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
    return () => {
      document.removeEventListener("keypress", handleKeyPress);
    };
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
    setWaitTime(JSON.parse(localStorage.getItem("waitTime")) || 30000);
    setConcatProcessStarted(
      JSON.parse(localStorage.getItem("concatProcessStarted")) || false
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
    let currentQuestion =
      questions[
        (questions.findIndex((item) => item.q === question) || 0) + 1
      ] || questions[0];
    setCountdown(currentQuestion.countdownTime / 1000);
    try {
      let countdownInterval = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);
      setQuestion(currentQuestion.q);
      setTimeout(async () => {
        clearInterval(countdownInterval);

        const stream = await navigator.mediaDevices.getUserMedia(
          await GetRecordingConstrains()
        );
        setVideoStream(stream);

        const recorder = new MediaRecorder(stream);
        setRecorder(recorder);
        const recordedChunks = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunks.push(event.data);
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
        setCountdown(currentQuestion.recordTime / 1000);

        countdownInterval = setInterval(() => {
          if (recorder.state === "inactive") {
            clearInterval(countdownInterval);
            return;
          }
          setCountdown((prevCountdown) => prevCountdown - 1);
        }, 1000);
        recorder.onstop = async () => {
          const { blob: videoBlob, fileName: videoFileName } = prepFile(
            recordedChunks,
            "mp4"
          );

          const { blob: srtBlob } = getSrtFile(
            currentQuestion.recordTime / 1000,
            currentQuestion.q
          );

          // Save video
          if (!sessionKey) {
            downloadFile(videoBlob, videoFileName);
            downloadFile(srtBlob, videoFileName.replace("mp4", "srt"));
          } else {
            // upload video
            await uploadTestimony(
              sessionKey,
              videoBlob,
              videoFileName,
              srtBlob,
              videoFileName.replace("mp4", "srt")
            );
            await GetSession(sessionKey);
          }
        };

        setTimeout(async () => {
          if (recorder.state === "inactive") return;
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
        }, currentQuestion.recordTime); // Record
      }, currentQuestion.countdownTime); // Countdown
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
      <h1
        style={{
          margin: "1rem",
          marginTop: "3rem",
          textAlign: "center",
          fontSize: recording ? null : "3em",
          transition: "all 3s ease",
        }}
      >
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
        {recording && (
          <button
            onClick={() => {
              const videoElement = document.getElementById("video");
              recorder.stop();
              setRecording(false);
              setWaiting(true);
              videoElement.srcObject = null;
              videoElement.src = null;
              setCountdown(waitTime / 1000);
              setConcatProcessStarted(false);
              localStorage.setItem("concatProcessStarted", false);
              let manualCountdownInterval = setInterval(() => {
                setCountdown((prevCountdown) => prevCountdown - 1);
              }, 1000);

              setTimeout(async () => {
                clearInterval(manualCountdownInterval);
                setWaiting(false);
                setStarted(false);
              }, waitTime); //wait
            }}
          >
            Ferdig snakka
          </button>
        )}
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
          defaultQuestions={defaultQuestions}
          setSettingsOpen={setSettingsOpen}
          waitTime={waitTime}
          setWaitTime={setWaitTime}
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
          setQuestions={(setter) => {
            localStorage.setItem(
              "questions",
              JSON.stringify(setter(questions))
            );

            setQuestions(setter(questions));
          }}
          questions={questions}
        />
      )}
      <Footer />
    </div>
  );
};

export default Testimony;
