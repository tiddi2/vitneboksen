import "./Footer.css";
import React from "react";

const Footer = () => {
  return (
    <div className="footer">
      <p className="footer__sponsor-text">
        Sponset av
        <a className="footer__sponsor-link" href="https://spritjakt.no">
          <img
            src="spritjakt.png"
            alt="spritjakt logo"
            className="footer__sponsor-logo"
          />
        </a>
        og
        <a
          className="footer__sponsor-link"
          href="https://erdetfesthosmatsikveld.no"
        >
          erdetfesthosmatsikveld.no
        </a>
      </p>
      <p className="footer__copyright-text">
        © 2024{" "}
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://no.linkedin.com/in/mats-l%C3%B8vstrand-berntsen-4682b2142"
        >
          Mats Løvstrand Berntsen
        </a>
      </p>
      <p className="footer__source-code">
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
  );
};

export default Footer;
