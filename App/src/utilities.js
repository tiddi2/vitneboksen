export const GetRecordingConstrains = async (ismobile = false) => {
  let constraints = {
    video: {
      width: { ideal: ismobile ? 720 : 1920 },
      height: { ideal: ismobile ? 1280 : 1080 },
      frameRate: { ideal: 30 },
    },
    audio: {
      noiseSuppression: false,
      echoCancellation: false,
      autoGainControl: false,
    },
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

export const downoadFile = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
