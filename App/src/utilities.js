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
