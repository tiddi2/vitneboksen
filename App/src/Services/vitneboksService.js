// File: apiService.js

// Generate a new GUID
function generateGuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Function to make the GET request
export async function createSession() {
  // URL for the API endpoint
  const apiUrl = "http://localhost:7052/api/create-session";

  // Generate a new GUID
  const sessionKey = generateGuid();

  // Append the sessionKey to the URL as a query parameter
  const urlWithQueryParam = `${apiUrl}?sessionKey=${sessionKey}`;

  try {
    // Make the GET request using fetch
    const response = await fetch(urlWithQueryParam, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // You can add additional headers if needed
      },
    });

    // Check if the request was successful
    if (!response.ok) {
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
