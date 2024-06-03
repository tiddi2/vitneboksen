import "./NewQuestion.css";
import React, { useState } from "react";
import "./NewQuestion.css";
import CloseButton from "../CloseButton/CloseButton";

const NewQuestion = ({ closeModal, saveQuestion }) => {
  const [question, setQuestion] = useState("");
  const [countdownTime, setCountdownTime] = useState("");
  const [recordingTime, setRecordingTime] = useState("");

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
  };

  return (
    <aside className="new-question modal">
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <div>
            <div>
              <label htmlFor="question">Spørsmål:</label>
            </div>
            <input
              type="text"
              id="question"
              value={question}
              onChange={handleQuestionChange}
              className="input-field"
            />
          </div>
          <label htmlFor="countdownTime">Nedtelling før opptak:</label>
          <div className="button-group">
            <button
              id="countdownTime-short"
              onClick={() => setCountdownTime(3000)}
              className={countdownTime === 3000 ? "active" : ""}
            >
              Short
            </button>
            <button
              id="countdownTime-medium"
              onClick={() => setCountdownTime(5000)}
              className={countdownTime === 5000 ? "active" : ""}
            >
              Medium
            </button>
            <button
              id="countdownTime-long"
              onClick={() => setCountdownTime(7000)}
              className={countdownTime === 7000 ? "active" : ""}
            >
              Long
            </button>
          </div>

          <label htmlFor="recordingTime">Maksimal opptakstid:</label>
          <div className="button-group">
            <button
              id="recordingTime-short"
              onClick={() => setRecordingTime(7000)}
              className={recordingTime === 7000 ? "active" : ""}
            >
              Short
            </button>
            <button
              id="recordingTime-medium"
              onClick={() => setRecordingTime(15000)}
              className={recordingTime === 15000 ? "active" : ""}
            >
              Medium
            </button>
            <button
              id="recordingTime-long"
              onClick={() => setRecordingTime(30000)}
              className={recordingTime === 30000 ? "active" : ""}
            >
              Long
            </button>
          </div>

          <div className="button-group">
            <button
              onClick={() => {
                saveQuestion({
                  q: question,
                  countdownTime,
                  recordingTime,
                });
                closeModal();
              }}
              type="submit"
              className="submit-button"
            >
              Lagre
            </button>
          </div>
          <CloseButton onClick={closeModal} label={"X"} ariaLabel={"Lukk"} />
        </form>
      </div>
    </aside>
  );
};

export default NewQuestion;
