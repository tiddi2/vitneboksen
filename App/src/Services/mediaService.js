const desiredWidth = 1920;
const desiredHeight = 1080;

// Calculate the aspect ratio
const aspectRatio = desiredWidth / desiredHeight;

export const GetVideoConfig = async () => {
  const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();

  if (supportedConstraints.aspectRatio) {
    // Check the supported aspect ratios
    const supportedAspectRatios = supportedConstraints.aspectRatio;

    // Choose the closest supported aspect ratio
    const closestAspectRatio = getClosestAspectRatio(
      aspectRatio,
      supportedAspectRatios
    );

    // Calculate width and height based on the chosen aspect ratio
    const adjustedWidth = Math.round(desiredHeight * closestAspectRatio);
    const adjustedHeight = desiredHeight;

    return {
      video: {
        width: { ideal: adjustedWidth },
        height: { ideal: adjustedHeight },
        aspectRatio: closestAspectRatio,
        frameRate: { ideal: 30 },
      },
      audio: true,
    };
  }

  function getClosestAspectRatio(targetRatio, supportedRatios) {
    return supportedRatios.reduce((closest, current) => {
      return Math.abs(current - targetRatio) < Math.abs(closest - targetRatio)
        ? current
        : closest;
    });
  }
};
