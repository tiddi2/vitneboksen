export const GetRecordingConstrains = async () => {
  let constraints = {
    video: {
      width: { ideal: 1200 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
    audio: {
      noiseSuppression: false,
      echoCancellation: false,
      autoGainControl: false,
    },
    mimeType: "video/webm",
  };

  return constraints;
};

export const prepFile = (recordedChunks, type) => {
  const blob = new Blob(recordedChunks);
  const now = new Date();
  const fileName = `vitneboksen_${now
    .toISOString()
    .replace(/[:.]/g, "-")}.${type}`;
  return { blob, fileName };
};

export const getSrtFile = (duration, text) => {
  // Generate and save SRT file
  const srtContent = `1\n00:00:00,000 --> 00:00:${duration},000\n${text}`;
  return prepFile([srtContent], "srt");
};

export const downloadFile = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const defaultQuestions = [
  {
    q: "Hvordan føler du deg i dag etter dagens hendelser? ",
    countdownTime: 5000,
    recordTime: 15000,
  },
  {
    q: "Hvem stoler du mest på i huset/feriestedet, og hvorfor? ",
    countdownTime: 5000,
    recordTime: 15000,
  },
  {
    q: "Hva synes du om de siste konfliktene eller diskusjonene som har oppstått?",
    countdownTime: 5000,
    recordTime: 15000,
  },
  {
    q: "Hvordan håndterte du dagens utfordringer eller oppgaver?",
    countdownTime: 5000,
    recordTime: 15000,
  },
  {
    q: "Er det noen spesiell person du føler deg nærmere nå sammenlignet med tidligere?",
    countdownTime: 5000,
    recordTime: 15000,
  },
  {
    q: "Hvem i gruppen tror du er den største konkurrenten din, og hvorfor? ",
    countdownTime: 5000,
    recordTime: 15000,
  },
  {
    q: "Har du noen strategier for å komme lenger i konkurransen/få en partner?",
    countdownTime: 5000,
    recordTime: 15000,
  },
  {
    q: "Hvordan har opplevelsen så langt påvirket dine personlige relasjoner og vennskap i gruppen?",
    countdownTime: 5000,
    recordTime: 15000,
  },
  {
    q: "Hva er din største frykt eller bekymring for tiden? ",
    countdownTime: 5000,
    recordTime: 15000,
  },
  {
    q: "Hvem synes du har endret seg mest siden starten av programmet, og hvorfor?",
    countdownTime: 5000,
    recordTime: 15000,
  },
  {
    q: "Hva savner du mest fra livet utenfor realityprogrammet? ",
    countdownTime: 5000,
    recordTime: 15000,
  },
  {
    q: "Hvordan takler du følelsen av isolasjon eller mangel på personvern? ",
    countdownTime: 5000,
    recordTime: 15000,
  },
  {
    q: "Er det noen personlige mål eller opplevelser du ønsker å oppnå mens du er her?",
    countdownTime: 5000,
    recordTime: 15000,
  },
  {
    q: "Hvordan påvirker konkurransen din oppfatning av andre deltakere? ",
    countdownTime: 5000,
    recordTime: 15000,
  },
  {
    q: "Hvordan tror du du vil se tilbake på denne opplevelsen når den er over?",
    countdownTime: 5000,
    recordTime: 15000,
  },
];
