import React from 'react';

function RewriteResult({ result }) {
  if (!result) {
    return null; // Don't render anything if there's no result
  }

  // The 'rewritten' field from the API contains the full structured response
  // including ANALYSIS, SUBJECT, and REWRITTEN EMAIL.
  // We can display it directly or try to parse it.
  // For now, let's display the parts we have directly and the full 'rewritten' content.

  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
      <h3>Rewrite Result</h3>

      {result.original && (
        <div>
          <h4>Original Email:</h4>
          <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '4px' }}>
            {result.original}
          </pre>
        </div>
      )}

      {result.tone && (
        <div style={{ margin: '10px 0' }}>
          <strong>Requested Tone:</strong> {result.tone}
        </div>
      )}

      {result.rewritten && (
        <div>
          <h4>Full AI Response:</h4>
          <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
            {result.rewritten}
          </pre>
        </div>
      )}
    </div>
  );
}

export default RewriteResult;
