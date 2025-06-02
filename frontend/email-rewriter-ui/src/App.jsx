import React, { useState } from 'react';
import ToneSelector from './components/ToneSelector';
import EmailEditor from './components/EmailEditor';
import RewriteResult from './components/RewriteResult';
import PromptReview from './components/PromptReview';
import HistoryExplorer from './components/HistoryExplorer';
import './App.css'; // You might want to create or use this for basic app styling

function App() {
  const [selectedTone, setSelectedTone] = useState('professional'); // Default tone
  const [rewriteResult, setRewriteResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleToneChange = (newTone) => {
    setSelectedTone(newTone);
    setRewriteResult(null); // Clear previous results when tone changes
    setError(null); // Clear previous errors
  };

  const handleRewriteSubmit = (data) => {
    setRewriteResult(data);
    setError(null); // Clear previous errors
  };

  const handleRewriteError = (errorMessage) => {
    setError(errorMessage);
    setRewriteResult(null); // Clear previous results
  };

  return (
    <div className="App" style={{ maxWidth: '768px', margin: '20px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header>
        <h1>Email Rewriter Pro ✨</h1>
      </header>

      <main>
        <ToneSelector
          selectedTone={selectedTone}
          onToneChange={handleToneChange}
        />

        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
          <EmailEditor
            selectedTone={selectedTone}
            onRewriteSubmit={handleRewriteSubmit}
            onRewriteError={handleRewriteError}
            setIsLoading={setIsLoading}
          />
        </div>

        {isLoading && <p className="loading-message">Rewriting your email, please wait...</p>}

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {rewriteResult && !error && (
          <RewriteResult result={rewriteResult} />
        )}
      </main>
      <hr style={{ margin: '30px 0' }} />
      <PromptReview />
      <hr style={{ margin: '30px 0' }} />
      <HistoryExplorer />
    </div>
  );
}

export default App;
