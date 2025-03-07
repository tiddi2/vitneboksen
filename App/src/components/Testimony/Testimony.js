import React, { useState, useEffect, useCallback } from "react";
import {
  deleteSession,
  getOrCreateSession,
  uploadTestimony,
  updateQuestions,
  updateSessionName,
} from "../../Services/vitneboksService";
import "./Testimony.css";
import Settings from "../Settings/Settings";
import { GetRecordingConstrains, prepFile } from "../../utilities";
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
  const [sessionName, setSessionName] = useState(null);
  const [sharedKey, setSharedKey] = useState(null);
  const [inputKey, setInputKey] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [waitTime, setWaitTime] = useState(30000);
  const [lastUpload, setLastUpload] = useState(null);
  const [testimonialCount, setTestimonialCount] = useState(null);
  const [actionShotCount, setActionShotCount] = useState(null);

  const [finalVideoProcessingStarted, setFinalVideoProcessingStarted] =
    useState(false);
  const [finalVideoProcessingCompleted, setFinalVideoProcessingCompleted] =
    useState(false);

  const GetSession = useCallback(
    async (sessionKey = inputKey) => {
      if (sessionKey == null) {
        sessionKey = localStorage.getItem("sessionKey");
      }
      if (recording) return;
      var {
        sharingKey: newSharedKey,
        sessionKey: newSessionKey,
        testimonials,
        actionshots,
        lastUpload,
        finalVideoCompleted,
        finalVideoStarted,
        questions,
        sessionName,
      } = await getOrCreateSession(sessionKey);
      if (newSessionKey) {
        setSessionKey(newSessionKey);
        setLastUpload(lastUpload);
        setActionShotCount(actionshots);
        setTestimonialCount(testimonials);
        setSharedKey(newSharedKey);
        setSessionName(sessionName);
        setQuestions(questions);
        setFinalVideoProcessingCompleted(finalVideoCompleted);
        setFinalVideoProcessingStarted(finalVideoStarted);
        localStorage.setItem("sessionKey", newSessionKey);
        localStorage.setItem("sharedKey", newSharedKey);
      }
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
    setWaitTime(JSON.parse(localStorage.getItem("waitTime")) || 30000);
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
        (questions.findIndex((item) => item.text === question) || 0) + 1
      ] || questions[0];
    setCountdown(currentQuestion.countdownTime / 1000);
    try {
      let countdownInterval = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);
      setQuestion(currentQuestion.text);
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

        checkAudioLevel(stream, 3000);

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

          await uploadTestimony(
            sessionKey,
            videoBlob,
            videoFileName,
            currentQuestion.text,
            videoFileName.replace("mp4", "srt")
          );
          await GetSession(sessionKey);
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

  const checkAudioLevel = (stream, durationMs = 3000) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    let silentSamples = 0;
    let lowSamples = 0;
    const sampleIntervalMs = 100;
    const silenceThreshold = 5;

    const checkSilence = () => {
      analyser.getByteFrequencyData(dataArray);
      const averageLevel =
        dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;

      if (averageLevel === 0) {
        silentSamples++;
      } else if (averageLevel < silenceThreshold) {
        lowSamples++;
      }
      if (silentSamples > 10) {
        alert("Ingen lyd oppdaget. Sjekk mikrofoninstillinger.");
      } else if (lowSamples * sampleIntervalMs >= durationMs) {
        alert("Lav lyd opptaket. Sjekk mikrofoninstillingene.");
      } else {
        if (stream.active) {
          setTimeout(checkSilence, sampleIntervalMs);
        }
      }
    };

    checkSilence();
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
          setSettingsOpen={setSettingsOpen}
          waitTime={waitTime}
          setWaitTime={setWaitTime}
          inputKey={inputKey}
          sessionKey={sessionKey}
          GetSession={GetSession}
          setInputKey={setInputKey}
          testimonialCount={testimonialCount}
          actionShotCount={actionShotCount}
          lastUpload={lastUpload}
          finalVideoProcessingStarted={finalVideoProcessingStarted}
          finalVideoProcessingCompleted={finalVideoProcessingCompleted}
          sharedKey={sharedKey}
          deleteSessionClick={deleteSessionClick}
          setQuestions={(setter) => {
            updateQuestions(sessionKey, setter(questions));
            setQuestions(setter(questions));
          }}
          questions={questions}
          sessionName={sessionName}
          setSessionName={(name) => {
            updateSessionName(sessionKey, name);
            setSessionName(name);
          }}
        />
      )}
      <Footer />
    </div>
  );
};

export default Testimony;
