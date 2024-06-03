import "./Settings.css";

import React, { useState } from "react";
import { generateConcatenatedVideo } from "../../Services/vitneboksService";
import { defaultQuestions } from "../../utilities";
import NewQuestion from "../NewQuestion/NewQuestion";
import CloseButton from "../CloseButton/CloseButton";

const Settings = ({
  setQuestionsRawString,
  setSettingsOpen,
  countdownTime,
  setCountdownTime,
  waitTime,
  recordTime,
  setRecordTime,
  setWaitTime,
  questionsRawString,
  inputKey,
  sessionKey,
  GetSession,
  setInputKey,
  sessionFetchTime,
  sessionWaiting,
  testimonialCount,
  actionShotCount,
  lastUpload,
  setConcatProcessStarted,
  concatProcessStarted,
  concatCompleted,
  sharedKey,
  deleteSessionClick,
  setQuestions,
}) => {
  const [sessionName, setSessionName] = useState(
    localStorage.getItem("sessionName", "")
  );

  const handleDownload = (url) => {
    const link = document.createElement("a");
    link.href = `${process.env.REACT_APP_API}${url}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [showModal, setShowModal] = useState(false);

  return (
    <aside className="settings">
      <CloseButton
        onClick={() => {
          setSettingsOpen(false);
        }}
        ariaLabel={"Vis bruksanvisning"}
      />
      <div className="form">
        <h3>Konfigurasjon</h3>
        <div>
          <span>Ventetid etter opptak:</span>
          <input
            type="number"
            value={waitTime / 1000}
            min={1}
            max={600}
            onChange={(e) => {
              let value = parseInt(e.target.value, 10) * 1000;
              setWaitTime(value);
              localStorage.setItem("waitTime", value);
            }}
          />
        </div>

        <span>Spørsmål </span>
        <button onClick={() => setShowModal(true)}>Add New Question</button>

        {showModal && (
          <NewQuestion
            closeModal={() => setShowModal(false)}
            saveQuestion={({ q, countdownTime, recordingTime }) => {
              setQuestions((prevQuestions) => [
                ...prevQuestions,
                { q, countdownTime, recordingTime },
              ]);
            }}
          />
        )}

        {sessionKey == null ? (
          <React.Fragment>
            <div>
              <span>Opprett ny vitneboks:</span>
              <button onClick={() => GetSession(null)}>Opprett ny</button>
            </div>
            <div>
              <span>Har du allerede en vitneboks?</span>
              <div>
                <input
                  type="text"
                  style={{ width: "5rem" }}
                  value={inputKey}
                  placeholder="vitnboks-ID"
                  onChange={(e) => setInputKey(e.target.value)}
                />
                &nbsp;
                <button onClick={() => GetSession()}>
                  Koble til eksisterende
                </button>
              </div>
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div>
              <h3>Tilkobling</h3>
              <span>
                Sist sjekket {new Date(sessionFetchTime).toLocaleTimeString()}{" "}
                <span
                  className={`clickable ${sessionWaiting ? "spinner" : ""}`}
                  onClick={() => GetSession()}
                >
                  🔄️
                </span>
              </span>
            </div>
            <div>
              <span>Arrangementnavn:</span>
              <input
                type="test"
                value={sessionName}
                onChange={(e) => {
                  setSessionName(e.target.value);
                  localStorage.setItem("sessionName", e.target.value);
                }}
              />
            </div>
            <div>
              <span>Antall videoer:</span>
              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                  }}
                >
                  <div>
                    <span>Vitnesbyrd: {testimonialCount}</span>
                    <br />
                    <span>Delelink: {actionShotCount}</span>
                    <br />
                  </div>
                  <button
                    onClick={() =>
                      handleDownload(
                        `download-session-files?sessionKey=${sessionKey}`
                      )
                    }
                  >
                    Last ned alle filer
                  </button>
                </div>
              </div>
            </div>
            {lastUpload && (
              <div>
                <span>Siste opplasting:</span>
                <span>{new Date(lastUpload).toLocaleString()}</span>
              </div>
            )}
            {testimonialCount + actionShotCount >= 1 && !concatCompleted && (
              <div>
                <span>
                  Vitneboksvideoen <br /> - Samle alle videoene til én fil.
                </span>
                <button
                  className="button"
                  disabled={concatProcessStarted}
                  onClick={async () => {
                    setConcatProcessStarted(true);
                    await generateConcatenatedVideo(sessionKey, sessionName);
                    setConcatProcessStarted(false);
                    GetSession(sessionKey);
                  }}
                >
                  {!concatProcessStarted ? (
                    "Lag video"
                  ) : (
                    <span className="spinner">🤖</span>
                  )}
                </button>
              </div>
            )}
            {actionShotCount + testimonialCount >= 1 && concatCompleted && (
              <div>
                <span>
                  Vitneboksvideoen <br /> - Samle alle videoene til én fil.
                </span>
                <button
                  onClick={() =>
                    handleDownload(
                      `download-concatenated-video?sessionKey=${sessionKey}`
                    )
                  }
                >
                  Last ned
                </button>
              </div>
            )}
            <div>
              <span>Vitneboks-ID:</span>
              <input type="text" value={sessionKey} disabled={true} />
            </div>
            <div>
              <span>Delelink:</span>
              <input
                type="text"
                value={`${window.location}?session=${sharedKey}`}
                disabled={true}
              />
            </div>
            <div>
              <span></span>
              <button className="red" onClick={deleteSessionClick}>
                Slett vitneboks
              </button>
            </div>
          </React.Fragment>
        )}
      </div>
    </aside>
  );
};
export default Settings;
