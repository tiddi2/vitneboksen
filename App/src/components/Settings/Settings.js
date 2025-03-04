import "./Settings.css";

import React, { useState } from "react";
import { generateConcatenatedVideo } from "../../Services/vitneboksService";
import NewQuestion from "../NewQuestion/NewQuestion";
import CloseButton from "../CloseButton/CloseButton";

const Settings = ({
  setSettingsOpen,
  waitTime,
  setWaitTime,
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
  questions,
  sessionName,
  setSessionName,
}) => {
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

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
      <button
        onClick={() => {
          if (document.fullscreenElement) {
            if (document.exitFullscreen) {
              document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
              /* Safari */
              document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
              /* IE11 */
              document.msExitFullscreen();
            }
          } else {
            var elem = document.documentElement;
            if (elem.requestFullscreen) {
              elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
              /* Safari */
              elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) {
              /* IE11 */
              elem.msRequestFullscreen();
            }
          }
        }}
      >
        Fullskjerm
      </button>
      <div className="form">
        <h3>Konfigurasjon</h3>
        {sessionKey && (
          <div>
            <div>
              <span>Ventetid mellom opptak:</span>
              <span>
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
                <span> sekunder</span>
              </span>
            </div>
            <div>
              <span>Spørsmål </span>
              <button onClick={() => setShowModal(true)}>
                Legg til nytt spørsmål
              </button>
            </div>
          </div>
        )}
        {sessionKey &&
          questions &&
          questions.map((question, index) => {
            return (
              <div key={index}>
                <span>{question.text}</span>
                <span className="settings-button-group">
                  <button
                    onClick={() => {
                      setIsEditingQuestion(true);
                      setEditingQuestionIndex(index);
                    }}
                  >
                    Endre
                  </button>
                  <button
                    onClick={() => {
                      setQuestions((prevQuestions) => [
                        ...prevQuestions.slice(0, index),
                        ...prevQuestions.slice(index + 1),
                      ]);
                    }}
                  >
                    Slett
                  </button>
                  <button
                    onClick={() => {
                      if (index === 0) return;
                      setQuestions((prevQuestions) => [
                        ...prevQuestions.slice(0, index - 1),
                        prevQuestions[index],
                        prevQuestions[index - 1],
                        ...prevQuestions.slice(index + 1),
                      ]);
                    }}
                  >
                    ^
                  </button>
                  <button
                    onClick={() => {
                      if (index === questions.length - 1) return;
                      setQuestions((prevQuestions) => [
                        ...prevQuestions.slice(0, index),
                        prevQuestions[index + 1],
                        prevQuestions[index],
                        ...prevQuestions.slice(index + 2),
                      ]);
                    }}
                  >
                    v
                  </button>
                </span>
              </div>
            );
          })}

        {isEditingQuestion && (
          <NewQuestion
            closeModal={() => {
              setShowModal(false);
              setIsEditingQuestion(false);
              setEditingQuestionIndex(null);
            }}
            saveQuestion={({ text, countdownTime, recordTime }) => {
              setQuestions((prevQuestions) => {
                const updatedQuestions = [...prevQuestions];
                updatedQuestions[editingQuestionIndex] = {
                  text,
                  countdownTime,
                  recordTime,
                };
                return updatedQuestions;
              });
              setIsEditingQuestion(false);
              setEditingQuestionIndex(null);
            }}
            defaultQuestion={questions[editingQuestionIndex].text.trim()}
            defaultCountDownTime={questions[editingQuestionIndex].countdownTime}
            defaultRecordTime={questions[editingQuestionIndex].recordTime}
          />
        )}
        {showModal && (
          <NewQuestion
            closeModal={() => setShowModal(false)}
            saveQuestion={({ text, countdownTime, recordTime }) => {
              setQuestions((prevQuestions) => [
                ...prevQuestions,
                { text, countdownTime, recordTime },
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
                onChange={(e) => setSessionName(e.target.value)}
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
