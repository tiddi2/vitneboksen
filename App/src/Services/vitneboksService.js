function generateKey() {
  return "xxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Function to make the GET request
export async function getOrCreateSession(existingSessionKey) {
  // URL for the API endpoint
  const sessionKey = existingSessionKey || generateKey();

  // Generate a new GUID
  // Append the sessionKey to the URL as a query parameter
  const urlWithQueryParam = `${process.env.REACT_APP_API}get-session?sessionKey=${sessionKey}`;

  try {
    // Make the GET request using fetch
    const response = await fetch(urlWithQueryParam, { method: "GET" });

    // Check if the request was successful
    if (!response.ok) {
      console.log(response.error);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    // Parse and return the response data
    const body = await response.json();
    return body;
  } catch (error) {
    // Handle errors here
    console.error("Error:", error);
    throw error; // Rethrow the error for the component to handle
  }
}

export async function generateConcatenatedVideo(sessionKey) {
  const urlWithQueryParam = `${process.env.REACT_APP_API}create-concatenated-video?sessionKey=${sessionKey}`;
  var response = await fetch(urlWithQueryParam, {
    method: "GET",
  });
  if (response.ok) {
    return true;
  }
  return false;
}

export async function getSharedSession(sharedKey) {
  const urlWithQueryParam = `${process.env.REACT_APP_API}get-shared-session?sharedKey=${sharedKey}`;

  const response = await fetch(urlWithQueryParam, {
    method: "GET",
  });

  if (response.ok) {
    return true;
  }
  return false;
}

export async function uploadTestemony(
  sessionKey,
  videofile,
  videoName,
  subfile,
  subName
) {
  const urlWithQueryParam = `${process.env.REACT_APP_API}upload-testemony?sessionKey=${sessionKey}`;

  const formData = new FormData();
  formData.append("video", videofile, videoName);
  formData.append("sub", subfile, subName);
  await uploadFile(urlWithQueryParam, formData);
}

export async function uploadActionShot(sharedKey, videofile, videoName) {
  const urlWithQueryParam = `${process.env.REACT_APP_API}upload-actionshot?sharedKey=${sharedKey}`;

  const formData = new FormData();
  formData.append("video", videofile, videoName);
  await uploadFile(urlWithQueryParam, formData);
}

export async function deleteSession(sessionKey) {
  const urlWithQueryParam = `${process.env.REACT_APP_API}delete-session?sessionKey=${sessionKey}`;

  try {
    await fetch(urlWithQueryParam, {
      method: "DELETE",
    });
  } catch (error) {
    console.log(error);
  }
  return true;
}

async function uploadFile(url, formData) {
  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
    } else {
      console.error("Failed to upload file");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
