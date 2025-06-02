import React, { useState } from 'react';
import { BASE_URL } from '../config'; // Import BASE_URL

function EmailEditor({ selectedTone, onRewriteSubmit, onRewriteError, setIsLoading }) {
  const [email, setEmail] = useState('');

  const handleRewrite = async () => {
    if (!email.trim()) {
      onRewriteError('Email content cannot be empty.');
      return;
    }
    if (!selectedTone) {
      onRewriteError('Please select a tone.');
      return;
    }

    setIsLoading(true);
    onRewriteError(null); // Clear previous errors

    try {
      const response = await fetch(`${BASE_URL}/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tone: selectedTone })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      onRewriteSubmit(data);
    } catch (error) {
      console.error('Rewrite API call failed:', error);
      onRewriteError(error.message || 'Failed to rewrite email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <textarea
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Paste your rough email here..."
        rows="10"
        style={{ width: '100%', marginBottom: '10px' }}
      />
      <button onClick={handleRewrite}>
        Rewrite Email
      </button>
    </div>
  );
}

export default EmailEditor;
