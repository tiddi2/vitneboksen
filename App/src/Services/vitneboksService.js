function generateKey() {
  return "xxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
const apiUrl = "https://vitneboksenfunc20240113125528.azurewebsites.net/api/";

// Function to make the GET request
export async function createSession(existingSessionKey) {
  // URL for the API endpoint
  const sessionKey = existingSessionKey || generateKey();

  // Generate a new GUID
  // Append the sessionKey to the URL as a query parameter
  const urlWithQueryParam = `${apiUrl}create-session?sessionKey=${sessionKey}`;

  try {
    // Make the GET request using fetch
    const response = await fetch(urlWithQueryParam, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": window.location,
        // You can add additional headers if needed
      },
    });

    // Check if the request was successful
    if (!response.ok) {
      console.log(response.error);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const sharingKey = await response.text();
    // Parse and return the response data
    return { sharedKey: sharingKey, sessionKey: sessionKey };
  } catch (error) {
    // Handle errors here
    console.error("Error:", error);
    throw error; // Rethrow the error for the component to handle
  }
}

export async function uploadTestemony(sessionKey, videofile, fileName) {
  const urlWithQueryParam = `${apiUrl}upload-testemony?sessionKey=${sessionKey}`;

  try {
    const formData = new FormData();
    formData.append("video", videofile, fileName);

    const response = await fetch(urlWithQueryParam, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      console.log("Video successfully uploaded");
    } else {
      console.error("Failed to upload video");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
