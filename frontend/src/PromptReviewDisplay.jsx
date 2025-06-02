import React from 'react';

const PromptReviewDisplay = ({ analysisResult }) => {
  if (!analysisResult) {
    // Render nothing or a placeholder message if there's no analysis result.
    // Returning null makes it render nothing.
    return null;
  }

  return (
    <div className="mt-6 p-4 border border-gray-300 rounded-md bg-gray-50 shadow-sm">
      <h3 className="text-xl font-semibold mb-3 text-gray-800">Prompt Analysis Results</h3>
      <pre className="whitespace-pre-wrap bg-white p-4 rounded shadow-inner text-sm text-gray-700 overflow-x-auto max-h-96">
        {analysisResult}
      </pre>
    </div>
  );
};

export default PromptReviewDisplay;
