import React from 'react';
import { applySuggestion } from './api'; // Assuming this is correctly imported

const PromptReviewDisplay = ({ analysis, onApplySuccess }) => { // Added onApplySuccess prop
    if (!analysis) return <p className="text-gray-500 italic">No analysis data available. Run analysis to see results.</p>;

    // Fallback for older string-based analysis (if necessary, otherwise remove if all analysis is structured)
    if (typeof analysis === 'string') {
        return (
            <div className="mt-6 p-4 border border-gray-300 rounded-md bg-gray-50 shadow-sm" style={{ fontFamily: 'sans-serif' }}>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">Prompt Analysis & Suggestions (Legacy Format)</h3>
                <pre className="whitespace-pre-wrap bg-white p-4 rounded shadow-inner text-sm text-gray-700 overflow-x-auto max-h-96">
                    {analysis}
                </pre>
                 <p className="text-sm text-gray-500 mt-2">Note: This is an older analysis format. Re-run analysis for structured suggestions.</p>
            </div>
        );
    }

    const handleApplySuggestion = async (componentType, componentId, newContent, reason) => {
        const componentName = componentType === 'base' ? 'Base Prompt' : `Tone: ${componentId}`;

        // Construct a preview of the new content (truncate if too long for an alert)
        const contentPreview = newContent.length > 200 ? newContent.substring(0, 197) + '...' : newContent;

        const confirmationMessage = `Are you sure you want to apply this suggestion to the ${componentName}?\n\nNew content:\n--------------------------\n${contentPreview}\n--------------------------\nReason: ${reason}`;

        if (!window.confirm(confirmationMessage)) {
            alert('Suggestion application cancelled.');
            return;
        }

        try {
            const result = await applySuggestion(componentType, componentId, newContent, reason);
            alert('Suggestion applied successfully! Backend response: ' + JSON.stringify(result.message || result));
            // Consider adding a callback prop to notify parent for data refresh, e.g., onApplySuccess()
        } catch (error) {
            console.error('Failed to apply suggestion:', error);
            alert(`Error applying suggestion: ${error.message}`);
        }
    };

    return (
        <div className="mt-6 space-y-6" style={{ fontFamily: 'sans-serif' }}>
            <h3 className="text-2xl font-semibold text-gray-700 mb-4">Prompt Analysis & Suggestions</h3>

            {analysis.overall_summary && (
                <div className="p-4 border border-gray-300 rounded-md bg-gray-50 shadow-sm">
                    <h4 className="text-lg font-semibold mb-2 text-gray-800">Overall Summary:</h4>
                    <p className="whitespace-pre-wrap bg-white p-3 rounded shadow-inner text-sm text-gray-700">{analysis.overall_summary}</p>
                </div>
            )}

            {analysis.tone_effectiveness_analysis && (
                <div className="p-4 border border-gray-300 rounded-md bg-gray-50 shadow-sm">
                    <h4 className="text-lg font-semibold mb-2 text-gray-800">Tone Effectiveness Analysis:</h4>
                    {Object.entries(analysis.tone_effectiveness_analysis).map(([tone, effectiveness]) => (
                         effectiveness && (
                            <div key={tone} className="p-3 mb-2 border border-gray-200 rounded-md bg-white shadow-sm">
                                <h5 className="text-md font-semibold capitalize text-blue-600">{tone}</h5>
                                <p className="whitespace-pre-wrap text-sm text-gray-700">{effectiveness}</p>
                            </div>
                        )
                    ))}
                </div>
            )}

            {analysis.revised_base_prompt && (
                <div className="p-4 border border-gray-300 rounded-md bg-yellow-50 shadow-sm">
                    <h4 className="text-lg font-semibold mb-2 text-gray-800">Suggested Revised Base Prompt:</h4>
                    <pre className="whitespace-pre-wrap bg-white p-3 rounded shadow-inner text-sm text-gray-700 font-mono border border-gray-200">
                        {analysis.revised_base_prompt}
                    </pre>
                    <button
                        onClick={() => handleApplySuggestion(
                            'base',
                            'active_base_prompt', // Conventional ID for the single active base prompt
                            analysis.revised_base_prompt,
                            'Applied GPT-4 suggestion for revised base prompt'
                        )}
                        className="mt-3 px-4 py-2 text-sm bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
                    >
                        Apply This Revised Base Prompt
                    </button>
                </div>
            )}

            {analysis.improvement_suggestions && analysis.improvement_suggestions.length > 0 && (
                <div className="p-4 border border-gray-300 rounded-md bg-gray-50 shadow-sm">
                    <h4 className="text-lg font-semibold mb-3 text-gray-800">Detailed Improvement Suggestions:</h4>
                    {analysis.improvement_suggestions.map((suggestion) => (
                        <div key={suggestion.id}
                             className={`p-3 mb-3 border rounded-md shadow-sm ${suggestion.priority === 'high' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                            <p className="text-sm text-gray-500 mb-1">Suggestion ID: {suggestion.id}</p>
                            <p className="font-semibold text-gray-700">{suggestion.description}</p>
                            <p><strong className="text-gray-600">Priority:</strong> <span style={{ color: suggestion.priority === 'high' ? 'red' : (suggestion.priority === 'medium' ? 'orange' : 'green')}}>{suggestion.priority.toUpperCase()}</span></p>
                            <p><strong className="text-gray-600">Component:</strong> {suggestion.component_type === 'base' ? 'Base Prompt' : `Tone: ${suggestion.component_keyword}`}</p>
                            {suggestion.suggestion_type && <p><strong className="text-gray-600">Type:</strong> {suggestion.suggestion_type}</p>}
                            {suggestion.current_text_snippet && (
                                <div className="mt-1">
                                    <p className="text-xs text-gray-500">Current Snippet:</p>
                                    <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded text-xs text-gray-600 border border-gray-200">{suggestion.current_text_snippet}</pre>
                                </div>
                            )}
                            <div className="mt-2">
                                <p className="text-xs text-gray-500">Suggested Text:</p>
                                <pre className="whitespace-pre-wrap bg-green-50 p-2 rounded text-sm text-gray-700 border border-green-200">
                                    {suggestion.suggested_replacement_text}
                                </pre>
                            </div>
                            <button
                                onClick={() => handleApplySuggestion(
                                    suggestion.component_type,
                                    suggestion.component_keyword || (suggestion.component_type === 'base' ? 'active_base_prompt' : ''),
                                    suggestion.suggested_replacement_text,
                                    `Applied GPT-4 suggestion (ID: ${suggestion.id}): ${suggestion.description.substring(0, 50)}...`
                                )}
                                className="mt-3 px-3 py-1 text-sm bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Apply Suggestion #{suggestion.id}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-xs text-gray-500 text-center mt-4">
                Note: Applying suggestions will directly update the prompt database.
            </p>
        </div>
    );
};

export default PromptReviewDisplay;
