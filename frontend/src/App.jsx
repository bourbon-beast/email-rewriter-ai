import { useState } from 'react'
import { rewriteEmail, analysePromptHistory } from './api' // Import analysePromptHistory
import PromptReviewButton from './PromptReviewButton' // Import PromptReviewButton
import PromptReviewDisplay from './PromptReviewDisplay' // Import PromptReviewDisplay
import RewriteHistoryTab from './RewriteHistoryTab'; // Import RewriteHistoryTab
import './App.css'

const TONES = [
  { id: 'professional', label: 'Professional' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'concise', label: 'Concise' },
  { id: 'action-oriented', label: 'Action-Oriented' }
]

function App() {
  const [originalEmail, setOriginalEmail] = useState('')
  const [rewrittenEmail, setRewrittenEmail] = useState('')
  const [selectedTone, setSelectedTone] = useState('professional')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  // State for prompt analysis
  const [promptAnalysisResult, setPromptAnalysisResult] = useState(null)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [analysisError, setAnalysisError] = useState(null)
  const [activeTab, setActiveTab] = useState('rewriter') // Default tab

  const handleRestoreFromHistory = (historyItem) => {
    setOriginalEmail(historyItem.original_email || '');
    setSelectedTone(historyItem.tone || 'professional'); // Default to 'professional' if tone is missing
    setRewrittenEmail(''); // Clear any previous rewritten email
    setError(null); // Clear any errors from the rewriter tab
    setActiveTab('rewriter');
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!originalEmail.trim()) {
      setError('Please enter an email to rewrite')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await rewriteEmail(originalEmail, selectedTone)
      setRewrittenEmail(result.rewritten)
    } catch (err) {
      setError(err.message || 'Failed to rewrite email. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleCopy = () => {
    navigator.clipboard.writeText(rewrittenEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleReset = () => {
    setOriginalEmail('')
    setRewrittenEmail('')
    setError(null) // Clear main form error
    // Optionally clear analysis results as well, or keep them
    // setPromptAnalysisResult(null);
    // setAnalysisError(null);
  }

  const handleAnalysePrompts = async () => {
    setIsAnalysing(true)
    setAnalysisError(null)
    setPromptAnalysisResult(null) // Clear previous results

    try {
      const result = await analysePromptHistory()
      // The 'output' key is based on what the backend /analyse_prompt returns
      setPromptAnalysisResult(result.output)
    } catch (err) {
      setAnalysisError(err.message || 'Failed to analyse prompts. Please try again.')
      console.error(err)
    } finally {
      setIsAnalysing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">✉️ Smart Email Rewriter</h1>
          <p className="text-gray-600">Transform your emails with AI-powered tone adjustments</p>
        </header>

        {/* Tab Navigation */}
        <nav className="mb-0 border-b-2 border-gray-300">
          <div className="flex space-x-1 justify-center">
            <button
              onClick={() => setActiveTab('rewriter')}
              className={`px-4 py-3 font-medium text-sm transition-colors rounded-t-lg
                ${activeTab === 'rewriter'
                  ? 'bg-white text-blue-600 border-gray-300 border-t-2 border-x-2 -mb-px'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 border-transparent border-b-2'
                }`}
            >
              Email Rewriter
            </button>
            <button
              onClick={() => setActiveTab('promptReview')}
              className={`px-4 py-3 font-medium text-sm transition-colors rounded-t-lg
                ${activeTab === 'promptReview'
                  ? 'bg-white text-blue-600 border-gray-300 border-t-2 border-x-2 -mb-px'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 border-transparent border-b-2'
                }`}
            >
              Prompt Review
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-3 font-medium text-sm transition-colors rounded-t-lg
                ${activeTab === 'history'
                  ? 'bg-white text-blue-600 border-gray-300 border-t-2 border-x-2 -mb-px'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 border-transparent border-b-2'
                }`}
            >
              Rewrite History
            </button>
          </div>
        </nav>
        
        {/* Tab Content Pane */}
        <div className="mt-6">
          {activeTab === 'rewriter' && (
            <main className="bg-white rounded-b-lg rounded-tr-lg shadow-md p-6">
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
              <label htmlFor="originalEmail" className="block text-gray-700 font-medium mb-2">
                Original Email
              </label>
              <textarea
                id="originalEmail"
                value={originalEmail}
                onChange={(e) => setOriginalEmail(e.target.value)}
                placeholder="Enter your email text here..."
                className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Select Tone
              </label>
              <div className="flex flex-wrap gap-2">
                {TONES.map(tone => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setSelectedTone(tone.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedTone === tone.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    disabled={isLoading}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>
            
            {error && (
              <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            <div className="flex justify-center">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Rewriting...' : 'Rewrite Email'}
              </button>
            </div>
          </form>
          
          {rewrittenEmail && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-medium text-gray-900">Rewritten Email</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                <p className="whitespace-pre-wrap">{rewrittenEmail}</p>
              </div>
            </div>
          )}
            </div>
          )}
          {/* Closing main and conditional block for 'rewriter' tab */}
        </main>
        )}
        
        {activeTab === 'promptReview' && (
          <section className="p-6 bg-white rounded-b-lg rounded-tr-lg shadow-md"> {/* Removed mt-8 */}
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Prompt Performance Review</h2>

            <h3 className="text-xl font-semibold text-gray-700 mt-6 mb-3">Current System Prompt Analysis</h3>
            <p className="text-gray-600 mb-4">
              Analyse the effectiveness of past prompt structures and get suggestions for improvement from GPT-4.
              This will use the history of all rewrites.
            </p>
            <PromptReviewButton
              onClick={handleAnalysePrompts}
              isLoading={isAnalysing}
              error={analysisError}
            />
            <PromptReviewDisplay analysisResult={promptAnalysisResult} />

            <h3 className="text-xl font-semibold text-gray-700 mt-8 mb-3">Effectiveness Analysis per Tone</h3>
            {/* Placeholder for content related to per-tone effectiveness */}
            <p className="text-gray-500 italic">Detailed per-tone analysis will be displayed here.</p>

            <h3 className="text-xl font-semibold text-gray-700 mt-8 mb-3">Brand Tone Guidance Improvements</h3>
            {/* Placeholder for content related to brand tone guidance */}
            <p className="text-gray-500 italic">Suggestions for improving brand tone guidance will appear here.</p>

            <h3 className="text-xl font-semibold text-gray-700 mt-8 mb-3">Per-tone Instructions</h3>
            {/* Placeholder for content related to per-tone instructions */}
            <p className="text-gray-500 italic">Editable per-tone instructions will be available here.</p>

          </section>
        )}

        {activeTab === 'history' && (
          // RewriteHistoryTab's root div will get bg-white, rounded-b-lg, rounded-tr-lg, shadow-md, p-6 from its own structure if needed
          // For now, let's assume RewriteHistoryTab handles its own padding and background for the content area
          <RewriteHistoryTab onRestoreFromHistory={handleRestoreFromHistory} />
        )}
        </div>

        <footer className="mt-12 text-center text-gray-500 text-sm"> {/* Increased mt for footer */}
          <p>Powered by Google Gemini API & OpenAI GPT-4</p>
        </footer>
      </div>
    </div>
  )
}

export default App
