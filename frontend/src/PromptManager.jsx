import React, { useState, useEffect, useCallback } from 'react';
import {
    getBasePrompt,
    updateBasePrompt,
    getTones,
    updateToneInstructions,
    createTone,
    getPromptHistory
} from './api'; // Assuming api.js is in the same directory

// --- Child Component Stubs ---

const BasePromptEditor = ({ initialBasePrompt, onSave }) => {
    const [content, setContent] = useState(initialBasePrompt || '');
    const [reason, setReason] = useState('');

    useEffect(() => {
        setContent(initialBasePrompt || '');
    }, [initialBasePrompt]);

    const handleSave = async () => {
        if (!reason.trim()) {
            alert('Please provide a reason for the change.');
            return;
        }
        try {
            await onSave(content, reason);
            alert('Base prompt updated successfully!');
            setReason(''); // Clear reason after save
        } catch (error) {
            console.error('Failed to save base prompt:', error);
            alert(`Error saving base prompt: ${error.message}`);
        }
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
            <h3>Base Prompt Editor</h3>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: '0.5rem' }}
                placeholder="Enter base prompt content here..."
            />
            <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for change (required)"
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: '0.5rem' }}
            />
            <button onClick={handleSave}>Save Base Prompt</button>
        </div>
    );
};

const ToneList = ({ tones, onEditTone, onCreateNewTone, onRefreshTones }) => {
    return (
        <div style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
            <h3>Tones <button onClick={onRefreshTones} style={{ marginLeft: '10px', fontSize: '0.8em'}}>Refresh</button></h3>
            {tones && tones.length > 0 ? (
                <ul>
                    {tones.map(tone => (
                        <li key={tone.keyword}>
                            <strong>{tone.label}</strong> ({tone.keyword})
                            <p>{tone.instructions || 'No instructions set.'}</p>
                            <button onClick={() => onEditTone(tone)}>Edit</button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No tones found or loaded.</p>
            )}
            <button onClick={onCreateNewTone}>Create New Tone</button>
        </div>
    );
};

// ToneEditor might be a modal or a separate section shown conditionally
const ToneEditor = ({ tone, onSave, onCancel }) => {
    const [instructions, setInstructions] = useState(tone ? tone.instructions || '' : '');
    const [reason, setReason] = useState('');

    useEffect(() => {
        setInstructions(tone ? tone.instructions || '' : '');
        setReason(''); // Clear reason when tone changes
    }, [tone]);

    if (!tone) return null; // Don't render if no tone is selected for editing

    const handleSave = async () => {
         if (!reason.trim()) {
            alert('Please provide a reason for the change.');
            return;
        }
        try {
            await onSave(tone.keyword, instructions, reason);
            alert(`Tone '${tone.label}' updated successfully!`);
        } catch (error) {
            console.error('Failed to save tone:', error);
            alert(`Error saving tone: ${error.message}`);
        }
    };

    return (
        <div style={{ border: '1px solid #ddd', padding: '1rem', marginTop: '1rem', backgroundColor: '#f9f9f9' }}>
            <h4>Editing Tone: {tone.label} ({tone.keyword})</h4>
            <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={5}
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: '0.5rem' }}
                placeholder="Enter tone-specific instructions here..."
            />
            <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for change (required)"
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: '0.5rem' }}
            />
            <button onClick={handleSave}>Save Changes</button>
            <button onClick={onCancel} style={{ marginLeft: '0.5rem' }}>Cancel</button>
        </div>
    );
};

const CreateToneForm = ({ onCreate, onCancel }) => {
    const [keyword, setKeyword] = useState('');
    const [label, setLabel] = useState('');
    const [instructions, setInstructions] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!keyword.trim() || !label.trim()) {
            alert('Keyword and Label are required.');
            return;
        }
        try {
            await onCreate(keyword, label, instructions);
            alert(`Tone '${label}' created successfully!`);
            // Clear form
            setKeyword('');
            setLabel('');
            setInstructions('');
        } catch (error) {
            console.error('Failed to create tone:', error);
            alert(`Error creating tone: ${error.message}`);
        }
    };

    return (
        <div style={{ border: '1px solid #ddd', padding: '1rem', marginTop: '1rem', backgroundColor: '#f0f0f0' }}>
            <h4>Create New Tone</h4>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '0.5rem' }}>
                    <label>Keyword: </label>
                    <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} required />
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                    <label>Label: </label>
                    <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} required />
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                    <label>Instructions: </label>
                    <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} style={{ width: '90%' }}/>
                </div>
                <button type="submit">Create Tone</button>
                <button type="button" onClick={onCancel} style={{ marginLeft: '0.5rem' }}>Cancel</button>
            </form>
        </div>
    );
};

const PromptHistoryView = ({ history, onRefreshHistory }) => {
    return (
        <div style={{ border: '1px solid #ccc', padding: '1rem', marginTop: '1rem' }}>
            <h3>Prompt Change History <button onClick={onRefreshHistory} style={{ marginLeft: '10px', fontSize: '0.8em'}}>Refresh</button></h3>
            {history && history.length > 0 ? (
                <ul style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {history.map(entry => (
                        <li key={entry.id} style={{ marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                            <strong>{entry.component_type === 'base' ? 'Base Prompt' : `Tone: ${entry.component_name || entry.component_id}`}</strong> ({new Date(entry.created_at).toLocaleString()})
                            <p><em>Reason:</em> {entry.change_reason || 'N/A'}</p>
                            {entry.old_content && <p><em>Old:</em> {entry.old_content.substring(0,100)}{entry.old_content.length > 100 && '...'}</p>}
                            <p><em>New:</em> {entry.new_content.substring(0,100)}{entry.new_content.length > 100 && '...'}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No history found or loaded.</p>
            )}
        </div>
    );
};

// --- Main PromptManager Component ---

const PromptManager = () => {
    const [basePrompt, setBasePrompt] = useState('');
    const [tones, setTones] = useState([]);
    const [history, setHistory] = useState([]);
    const [editingTone, setEditingTone] = useState(null); // null or tone object
    const [showCreateToneForm, setShowCreateToneForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [baseData, tonesData, historyData] = await Promise.all([
                getBasePrompt(),
                getTones(),
                getPromptHistory()
            ]);
            setBasePrompt(baseData.content);
            setTones(tonesData);
            setHistory(historyData);
        } catch (err) {
            console.error("Error fetching prompt data:", err);
            setError(err.message);
            alert(`Error fetching initial data: ${err.message}`)
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveBasePrompt = async (content, reason) => {
        await updateBasePrompt(content, reason);
        setBasePrompt(content); // Optimistic update or re-fetch
        fetchHistory(); // Refresh history
    };

    const handleSaveTone = async (keyword, instructions, reason) => {
        await updateToneInstructions(keyword, instructions, reason);
        fetchTones(); // Re-fetch tones to show updated instructions
        fetchHistory(); // Refresh history
        setEditingTone(null); // Close editor
    };

    const handleCreateTone = async (keyword, label, instructions) => {
        await createTone(keyword, label, instructions);
        fetchTones(); // Re-fetch tones
        fetchHistory(); // Refresh history
        setShowCreateToneForm(false); // Close form
    };

    const fetchTones = useCallback(async () => {
        try {
            const tonesData = await getTones();
            setTones(tonesData);
        } catch (err) {
            console.error("Error fetching tones:", err);
            alert(`Error refreshing tones: ${err.message}`)
        }
    }, []);

    const fetchHistory = useCallback(async () => {
        try {
            const historyData = await getPromptHistory();
            setHistory(historyData);
        } catch (err) {
            console.error("Error fetching history:", err);
            alert(`Error refreshing history: ${err.message}`)
        }
    }, []);

    if (isLoading) return <p>Loading prompt manager...</p>;
    if (error) return <p>Error loading data: {error}</p>;

    return (
        <div>
            <h2>Prompt Management</h2>

            <BasePromptEditor
                initialBasePrompt={basePrompt}
                onSave={handleSaveBasePrompt}
            />

            <ToneList
                tones={tones}
                onEditTone={setEditingTone}
                onCreateNewTone={() => { setEditingTone(null); setShowCreateToneForm(true); }}
                onRefreshTones={fetchTones}
            />

            {editingTone && !showCreateToneForm && (
                <ToneEditor
                    tone={editingTone}
                    onSave={handleSaveTone}
                    onCancel={() => setEditingTone(null)}
                />
            )}

            {showCreateToneForm && !editingTone && (
                <CreateToneForm
                    onCreate={handleCreateTone}
                    onCancel={() => setShowCreateToneForm(false)}
                />
            )}

            <PromptHistoryView history={history} onRefreshHistory={fetchHistory} />

            {/* Placeholder for Apply Suggestion integration - to be fleshed out in Phase 4 */}
            {/* <div style={{ border: '1px solid #ccc', padding: '1rem', marginTop: '1rem' }}> */}
            {/*   <h3>Apply GPT-4 Suggestions</h3> */}
            {/*   <p>Feature to be integrated in Phase 4, interacting with PromptReviewDisplay.jsx</p> */}
            {/* </div> */}
        </div>
    );
};

export default PromptManager;
