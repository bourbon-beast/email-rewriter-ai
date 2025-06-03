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

// --- Prompt Management API Functions ---

export const getBasePrompt = async () => {
  try {
    const response = await axios.get(`${BASE_API_URL}/prompts/base`);
    return response.data;
  } catch (error) {
    console.error('Error fetching base prompt:', error);
    if (error.response) {
      const errorDetail = error.response.data.detail || error.response.data.error || 'Server error fetching base prompt';
      throw new Error(errorDetail);
    } else if (error.request) {
      throw new Error('No response from server for getBasePrompt. Please check if the backend is running.');
    } else {
      throw new Error('Error setting up request for getBasePrompt: ' + error.message);
    }
  }
};

export const updateBasePrompt = async (content, reason) => {
  try {
    const response = await axios.put(`${BASE_API_URL}/prompts/base`, { content, reason });
    return response.data;
  } catch (error) {
    console.error('Error updating base prompt:', error);
    if (error.response) {
      const errorDetail = error.response.data.detail || error.response.data.error || 'Server error updating base prompt';
      throw new Error(errorDetail);
    } else if (error.request) {
      throw new Error('No response from server for updateBasePrompt. Please check if the backend is running.');
    } else {
      throw new Error('Error setting up request for updateBasePrompt: ' + error.message);
    }
  }
};

export const getTones = async () => {
  try {
    const response = await axios.get(`${BASE_API_URL}/prompts/tones`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tones:', error);
    if (error.response) {
      const errorDetail = error.response.data.detail || error.response.data.error || 'Server error fetching tones';
      throw new Error(errorDetail);
    } else if (error.request) {
      throw new Error('No response from server for getTones. Please check if the backend is running.');
    } else {
      throw new Error('Error setting up request for getTones: ' + error.message);
    }
  }
};

export const updateToneInstructions = async (keyword, instructions, reason) => {
  try {
    const response = await axios.put(`${BASE_API_URL}/prompts/tones/${keyword}`, { instructions, reason });
    return response.data;
  } catch (error) {
    console.error(`Error updating tone ${keyword}:`, error);
    if (error.response) {
      const errorDetail = error.response.data.detail || error.response.data.error || `Server error updating tone ${keyword}`;
      throw new Error(errorDetail);
    } else if (error.request) {
      throw new Error(`No response from server for updateToneInstructions on tone ${keyword}. Please check if the backend is running.`);
    } else {
      throw new Error(`Error setting up request for updateToneInstructions on tone ${keyword}: ` + error.message);
    }
  }
};

export const createTone = async (keyword, label, instructions) => {
  try {
    const response = await axios.post(`${BASE_API_URL}/prompts/tones`, { keyword, label, instructions });
    return response.data; // Expects 201 Created with new tone data
  } catch (error) {
    console.error('Error creating tone:', error);
    if (error.response) {
      const errorDetail = error.response.data.detail || error.response.data.error || 'Server error creating tone';
      throw new Error(errorDetail);
    } else if (error.request) {
      throw new Error('No response from server for createTone. Please check if the backend is running.');
    } else {
      throw new Error('Error setting up request for createTone: ' + error.message);
    }
  }
};

export const getPromptHistory = async () => {
  try {
    const response = await axios.get(`${BASE_API_URL}/prompts/history`);
    return response.data;
  } catch (error) {
    console.error('Error fetching prompt history:', error);
    if (error.response) {
      const errorDetail = error.response.data.detail || error.response.data.error || 'Server error fetching prompt history';
      throw new Error(errorDetail);
    } else if (error.request) {
      throw new Error('No response from server for getPromptHistory. Please check if the backend is running.');
    } else {
      throw new Error('Error setting up request for getPromptHistory: ' + error.message);
    }
  }
};

export const applySuggestion = async (componentType, componentId, newContent, reason) => {
  // This endpoint is currently a placeholder in the backend (returns 501 Not Implemented)
  // The frontend can call it, but should be prepared to handle the 501 error gracefully.
  try {
    const response = await axios.post(`${BASE_API_URL}/prompts/apply-suggestion`, {
      component_type: componentType,
      component_id: componentId,
      new_content: newContent,
      reason: reason
    });
    return response.data;
  } catch (error) {
    console.error('Error applying suggestion:', error);
    if (error.response) {
      // Special handling for 501 if needed
      if (error.response.status === 501) {
        console.warn('Apply suggestion endpoint is not implemented yet.');
        // Optionally throw a specific error or return a specific structure indicating not implemented
      }
      const errorDetail = error.response.data.detail || error.response.data.error || 'Server error applying suggestion';
      throw new Error(errorDetail);
    } else if (error.request) {
      throw new Error('No response from server for applySuggestion. Please check if the backend is running.');
    } else {
      throw new Error('Error setting up request for applySuggestion: ' + error.message);
    }
  }
};

export const getRewriteHistory = async () => {
  try {
    const response = await axios.get(`${BASE_API_URL}/history`);
    return response.data;
  } catch (error) {
    console.error('Error fetching rewrite history:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const errorDetail = error.response.data.detail || error.response.data.error;
      throw new Error(errorDetail || 'Server error fetching history');
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response from server for history. Please check if the backend is running.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error('Error setting up request for history: ' + error.message);
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
