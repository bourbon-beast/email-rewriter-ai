import React, { useState, useEffect } from 'react';
import { getRewriteHistory } from './api';

function RewriteHistoryTab(props) { // Added props to receive onRestoreFromHistory
  const [completeHistoryItems, setCompleteHistoryItems] = useState([]); // Store all fetched items
  const [filteredAndSortedHistoryItems, setFilteredAndSortedHistoryItems] = useState([]); // Items to display
  const [selectedItemId, setSelectedItemId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for filters
  const [filterTone, setFilterTone] = useState('');
  const [filterDate, setFilterDate] = useState(''); // YYYY-MM-DD
  const [filterSubject, setFilterSubject] = useState('');

  // State for sorting
  const [sortBy, setSortBy] = useState('timestamp'); // 'timestamp', 'tone', 'subject'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  // State for copy feedback
  const [copied, setCopied] = useState(false);


  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getRewriteHistory();
        setCompleteHistoryItems(data || []);
        setFilteredAndSortedHistoryItems(data || []); // Initialize with all items
      } catch (err) {
        setError(err.message || 'Failed to fetch rewrite history.');
        setCompleteHistoryItems([]);
        setFilteredAndSortedHistoryItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Effect to apply filters and sorting when dependencies change
  useEffect(() => {
    let items = [...completeHistoryItems];

    // Apply filters
    if (filterTone) {
      items = items.filter(item => item.tone && item.tone.toLowerCase() === filterTone.toLowerCase());
    }
    if (filterDate) { // Expects YYYY-MM-DD
      items = items.filter(item => item.timestamp && item.timestamp.startsWith(filterDate));
    }
    if (filterSubject) {
      const subjectLower = filterSubject.toLowerCase();
      items = items.filter(item =>
        (item.original_email && item.original_email.toLowerCase().includes(subjectLower)) ||
        (item.gemini_response && item.gemini_response.toLowerCase().includes(subjectLower))
      );
    }

    // Apply sorting
    items.sort((a, b) => {
      let valA, valB;

      switch (sortBy) {
        case 'tone':
          valA = a.tone || '';
          valB = b.tone || '';
          break;
        case 'subject': // Simple sort by original email for now
          valA = a.original_email || '';
          valB = b.original_email || '';
          break;
        case 'timestamp':
        default:
          valA = new Date(a.timestamp);
          valB = new Date(b.timestamp);
          break;
      }

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return sortOrder === 'desc' ? comparison * -1 : comparison;
    });

    setFilteredAndSortedHistoryItems(items);
  }, [completeHistoryItems, filterTone, filterDate, filterSubject, sortBy, sortOrder]);


  const handleSelectChange = (event) => {
    setSelectedItemId(event.target.value);
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const handleRestore = (itemToRestore) => {
    if (props.onRestoreFromHistory) {
      props.onRestoreFromHistory(itemToRestore);
    }
  };

  const selectedItem = filteredAndSortedHistoryItems.find(item => (item.id || item.timestamp) === selectedItemId);

  if (isLoading) {
    return <p className="text-center text-gray-500">Loading history...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">Error: {error}</p>;
  }

  return (
    // Added standard panel styling, removed space-y-6
    <div className="bg-white rounded-b-lg rounded-tr-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Rewrite History Explorer</h2> {/* Added mb-6 */}

      {/* Filter and Sort Controls */}
      <div className="p-4 bg-gray-100 rounded-lg shadow mb-6"> {/* Added mb-6 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="filterTone" className="block text-sm font-medium text-gray-700">Filter by Tone:</label>
            <input
              type="text"
              id="filterTone"
              value={filterTone}
              onChange={(e) => setFilterTone(e.target.value)}
              placeholder="e.g., Professional"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="filterDate" className="block text-sm font-medium text-gray-700">Filter by Date (YYYY-MM-DD):</label>
            <input
              type="date" // Changed to date type for easier input
              id="filterDate"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="filterSubject" className="block text-sm font-medium text-gray-700">Filter by Subject/Content:</label>
            <input
              type="text"
              id="filterSubject"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              placeholder="Search in email content"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">Sort by:</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="timestamp">Timestamp</option>
              <option value="tone">Tone</option>
              <option value="subject">Subject (Original Email)</option>
            </select>
          </div>
          <div>
            <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700">Order:</label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Dropdown */}
      {filteredAndSortedHistoryItems.length > 0 ? (
        <div className="mb-6"> {/* Increased mb */}
          <label htmlFor="historySelect" className="block text-gray-700 font-medium mb-2">
            Select a history entry ({filteredAndSortedHistoryItems.length} found):
          </label>
          <select
            id="historySelect"
            value={selectedItemId}
            onChange={handleSelectChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>-- Select an entry --</option>
            {filteredAndSortedHistoryItems.map((item, index) => (
              <option key={item.id || item.timestamp || index} value={item.id || item.timestamp}>
                {new Date(item.timestamp).toLocaleString()} (Tone: {item.tone})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="text-center text-gray-500">No history entries match your current filters.</p>
      )}


      {/* Selected Item Display */}
      {selectedItem && (
        <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Entry Details</h3>
          <div className="space-y-3">
            <p><strong>Timestamp:</strong> <pre className="whitespace-pre-wrap bg-gray-50 p-2 border rounded text-sm">{new Date(selectedItem.timestamp).toLocaleString()}</pre></p>
            <p><strong>Original Email:</strong> <pre className="whitespace-pre-wrap bg-gray-50 p-2 border rounded text-sm">{selectedItem.original_email || 'N/A'}</pre></p>
            <p><strong>Tone:</strong> <pre className="whitespace-pre-wrap bg-gray-50 p-2 border rounded text-sm">{selectedItem.tone || 'N/A'}</pre></p>
            <p><strong>Final Prompt Used:</strong> <pre className="whitespace-pre-wrap bg-gray-50 p-2 border rounded text-sm">{selectedItem.final_prompt || 'N/A'}</pre></p>
            <p><strong>Rewritten Email (Gemini Response):</strong> <pre className="whitespace-pre-wrap bg-gray-50 p-2 border rounded text-sm">{selectedItem.gemini_response || 'N/A'}</pre></p>
            <p><strong>User Feedback:</strong> <span className="italic text-gray-500">N/A (feature coming soon)</span></p> {/* Placeholder for feedback */}
          </div>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={() => handleCopyToClipboard(selectedItem.gemini_response)}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {copied ? 'Copied!' : 'Copy Rewritten'}
            </button>
            {props.onRestoreFromHistory && ( // Conditionally render Restore button
              <button
                onClick={() => handleRestore(selectedItem)}
                className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Restore to Rewriter
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RewriteHistoryTab;
