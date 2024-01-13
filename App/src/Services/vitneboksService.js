// Function to make the GET request
export async function createSession() {
  // URL for the API endpoint
  const apiUrl = "http://localhost:7052/api/";

  // Generate a new GUID
  // Append the sessionKey to the URL as a query parameter
  const urlWithQueryParam = `${apiUrl}create-session`;

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
