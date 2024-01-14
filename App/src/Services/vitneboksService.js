function generateKey() {
  return "xxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
const apiUrl = process.env.REACT_APP_API;

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
    return { newSharedKey: sharingKey, newSessionKey: sessionKey };
  } catch (error) {
    // Handle errors here
    console.error("Error:", error);
    throw error; // Rethrow the error for the component to handle
  }
}

export async function uploadTestemony(
  sessionKey,
  videofile,
  videoName,
  subfile,
  subName
) {
  const urlWithQueryParam = `${apiUrl}upload-testemony?sessionKey=${sessionKey}`;

  const formData = new FormData();
  formData.append("video", videofile, videoName);
  formData.append("sub", subfile, subName);
  await uploadFile(urlWithQueryParam, formData);
}

export async function uploadActionShot(sharedKey, videofile, videoName) {
  const urlWithQueryParam = `${apiUrl}upload-actionshot?sharedKey=${sharedKey}`;

  const formData = new FormData();
  formData.append("video", videofile, videoName);
  await uploadFile(urlWithQueryParam, formData);
}

async function uploadFile(url, formData) {
  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      console.log("file successfully uploaded");
    } else {
      console.error("Failed to upload file");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
