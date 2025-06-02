import React from 'react';

const PromptReviewButton = ({ onClick, isLoading, error }) => {
  return (
    <div className="my-4">
      <button
        onClick={onClick}
        disabled={isLoading}
        className="px-4 py-2 bg-green-500 text-white font-medium rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Analysing...' : 'Review Prompt Performance'}
      </button>
      {error && (
        <div className="mt-2 text-sm text-red-600">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default PromptReviewButton;
