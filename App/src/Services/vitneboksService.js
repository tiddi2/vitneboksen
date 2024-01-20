function generateKey() {
  return "xxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Function to make the GET request
export async function getSession(existingSessionKey) {
  // URL for the API endpoint
  const sessionKey = existingSessionKey || generateKey();

  // Generate a new GUID
  // Append the sessionKey to the URL as a query parameter
  const urlWithQueryParam = `${process.env.REACT_APP_API}get-session?sessionKey=${sessionKey}`;

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
    // Parse and return the response data
    return await response.json();
  } catch (error) {
    // Handle errors here
    console.error("Error:", error);
    throw error; // Rethrow the error for the component to handle
  }
}

export async function getSharedSession(sharedKey) {
  const urlWithQueryParam = `${process.env.REACT_APP_API}get-shared-session?sharedKey=${sharedKey}`;

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
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": window.location,
      },
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
      console.log("file successfully uploaded");
    } else {
      console.error("Failed to upload file");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
