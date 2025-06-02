import axios from 'axios';

const BASE_API_URL = 'http://localhost:8000'; // Updated port and made it a base URL

export const rewriteEmail = async (email, tone) => {
  try {
    const response = await axios.post(`${BASE_API_URL}/rewrite`, { // Use base URL + endpoint
      email,
      tone
    });
    
    return response.data;
  } catch (error) {
    console.error('Error rewriting email:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(error.response.data.error || 'Server error during email rewrite');
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response from server for email rewrite. Please check if the backend is running.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error('Error setting up request for email rewrite: ' + error.message);
    }
  }
};

export const analysePromptHistory = async () => {
  try {
    // Make a POST request to the /analyse_prompt endpoint.
    // The backend reads the history file itself, so an empty object or null is fine as the payload.
    const response = await axios.post(`${BASE_API_URL}/analyse_prompt`, {});
    return response.data; // This should be the analysis output from GPT-4
  } catch (error) {
    console.error('Error analysing prompt history:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      // Use error.response.data.detail if available, otherwise error.response.data.error
      const errorDetail = error.response.data.detail || error.response.data.error;
      throw new Error(errorDetail || 'Server error during prompt analysis');
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response from server for prompt analysis. Please check if the backend is running.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error('Error setting up request for prompt analysis: ' + error.message);
    }
  }
};
