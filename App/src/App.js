import React, { useState, useEffect } from "react";
import queryString from "query-string";
import Home from "./components/Home/home";
import "./App.css";
import ActionShot from "./components/ActionShot/actionShot";

const App = () => {
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    let parsed = queryString.parse(window.location.search);
    if (parsed?.session) {
      setSessionId(parsed.session);
    }
  }, []);

  return <div>{sessionId ? <ActionShot /> : <Home />}</div>;
};

export default App;
