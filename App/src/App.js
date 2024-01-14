import React, { useState, useEffect } from "react";
import queryString from "query-string";
import Home from "./components/Home/home";
import "./App.css";
import ActionShot from "./components/ActionShot/actionShot";

const App = () => {
  const [sharedKey, setSharedKey] = useState(null);

  useEffect(() => {
    let parsed = queryString.parse(window.location.search);
    if (parsed?.session) {
      setSharedKey(parsed.session);
    } else {
      setSharedKey(false);
    }
  }, []);

  return (
    <div>{sharedKey !== null ? sharedKey ? <ActionShot /> : <Home /> : ""}</div>
  );
};

export default App;
