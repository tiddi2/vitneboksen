import "./NewQuestion.css";
import React, { useState } from "react";
import "./NewQuestion.css";
import CloseButton from "../CloseButton/CloseButton";

const NewQuestion = ({
  defaultQuestion,
  defaultCountDownTime,
  defaultRecordTime,
  closeModal,
  saveQuestion,
}) => {
  const [question, setQuestion] = useState(defaultQuestion || "");
  const [countdownTime, setCountdownTime] = useState(
    defaultCountDownTime || 5000
  );
  const [recordTime, setrecordTime] = useState(defaultRecordTime || 15000);

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
  };

  return (
    <aside className="new-question modal">
      <div className="modal-content">
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
            Kort (3 sek)
          </button>
          <button
            id="countdownTime-medium"
            onClick={() => setCountdownTime(5000)}
            className={countdownTime === 5000 ? "active" : ""}
          >
            Medium (5 sek)
          </button>
          <button
            id="countdownTime-long"
            onClick={() => setCountdownTime(7000)}
            className={countdownTime === 7000 ? "active" : ""}
          >
            Lang (7 sek)
          </button>
        </div>

        <label htmlFor="recordTime">Maksimal opptakstid:</label>
        <div className="button-group">
          <button
            id="recordTime-short"
            onClick={() => setrecordTime(7000)}
            className={recordTime === 7000 ? "active" : ""}
          >
            Kort (7 sek)
          </button>
          <button
            id="recordTime-medium"
            onClick={() => setrecordTime(15000)}
            className={recordTime === 15000 ? "active" : ""}
          >
            Medium (15 sek)
          </button>
          <button
            id="recordTime-long"
            onClick={() => setrecordTime(30000)}
            className={recordTime === 30000 ? "active" : ""}
          >
            Lang (30 sek)
          </button>
        </div>

        <div className="button-group">
          <button
            onClick={() => {
              saveQuestion({
                text: question.trim(),
                countdownTime,
                recordTime,
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
      </div>
    </aside>
  );
};

export default NewQuestion;
