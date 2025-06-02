import axios from 'axios';

const API_URL = 'http://localhost:5000/rewrite';

export const rewriteEmail = async (email, tone) => {
  try {
    const response = await axios.post(API_URL, {
      email,
      tone
    });
    
    return response.data;
  } catch (error) {
    console.error('Error rewriting email:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(error.response.data.error || 'Server error');
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response from server. Please check if the backend is running.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error('Error setting up request: ' + error.message);
    }
  }
};
