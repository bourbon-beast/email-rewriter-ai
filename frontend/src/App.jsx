import { useState } from 'react'
import { rewriteEmail, analysePromptHistory } from './api'
import PromptReviewButton from './PromptReviewButton'
import PromptReviewDisplay from './PromptReviewDisplay'
import RewriteHistoryTab from './RewriteHistoryTab'
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

  // Updated state for structured prompt analysis
  const [analysisData, setAnalysisData] = useState(null)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [analysisError, setAnalysisError] = useState(null)
  const [activeTab, setActiveTab] = useState('rewriter')

  const handleRestoreFromHistory = (historyItem) => {
    setOriginalEmail(historyItem.original_email || '');
    setSelectedTone(historyItem.tone || 'professional');
    setRewrittenEmail('');
    setError(null);
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
    setError(null)
  }

  const handleAnalysePrompts = async () => {
    setIsAnalysing(true)
    setAnalysisError(null)
    setAnalysisData(null)

    try {
      const result = await analysePromptHistory()
      
      // Check if we got structured data or old format
      if (result.overall_summary) {
        setAnalysisData(result)
      } else if (result.output) {
        // Fallback for old format
        setAnalysisData({
          overall_summary: result.output,
          tone_effectiveness: {},
          improvement_suggestions: '',
          revised_prompt: ''
        })
      } else {
        setAnalysisData(result)
      }
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
            </main>
          )}
          
          {activeTab === 'promptReview' && (
            <section className="p-6 bg-white rounded-b-lg rounded-tr-lg shadow-md">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">Prompt Performance Review</h2>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-3">Current System Prompt Analysis</h3>
                <p className="text-gray-600 mb-4">
                  Analyse the effectiveness of past prompt structures and get suggestions for improvement from GPT-4.
                  This will use the history of all rewrites.
                </p>
                <PromptReviewButton
                  onClick={handleAnalysePrompts}
                  isLoading={isAnalysing}
                  error={analysisError}
                />
                
                {/* Overall Summary */}
                {analysisData?.overall_summary && (
                  <div className="mt-6 p-4 border border-gray-300 rounded-md bg-gray-50 shadow-sm">
                    <h4 className="text-lg font-semibold mb-3 text-gray-800">Overall Analysis</h4>
                    <div className="whitespace-pre-wrap bg-white p-4 rounded shadow-inner text-sm text-gray-700">
                      {analysisData.overall_summary}
                    </div>
                  </div>
                )}
              </div>

              {/* Effectiveness Analysis per Tone */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-3">Effectiveness Analysis per Tone</h3>
                {analysisData?.tone_effectiveness && Object.keys(analysisData.tone_effectiveness).length > 0 ? (
                  <div className="space-y-4">
                    {TONES.map(tone => (
                      analysisData.tone_effectiveness[tone.id] && (
                        <div key={tone.id} className="p-4 border border-gray-300 rounded-md bg-gray-50 shadow-sm">
                          <h4 className="text-lg font-semibold mb-2 text-gray-800 capitalize">{tone.label} Tone</h4>
                          <div className="whitespace-pre-wrap bg-white p-3 rounded shadow-inner text-sm text-gray-700">
                            {analysisData.tone_effectiveness[tone.id]}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Run analysis to see detailed per-tone effectiveness data.</p>
                )}
              </div>

              {/* Brand Tone Guidance Improvements */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-3">Brand Tone Guidance Improvements</h3>
                {analysisData?.improvement_suggestions ? (
                  <div className="p-4 border border-gray-300 rounded-md bg-gray-50 shadow-sm">
                    <div className="whitespace-pre-wrap bg-white p-4 rounded shadow-inner text-sm text-gray-700">
                      {analysisData.improvement_suggestions}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Suggestions for improving brand tone guidance will appear here after analysis.</p>
                )}
              </div>

              {/* Revised System Prompt */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-3">Revised System Prompt</h3>
                {analysisData?.revised_prompt ? (
                  <div className="p-4 border border-gray-300 rounded-md bg-gray-50 shadow-sm">
                    <div className="whitespace-pre-wrap bg-white p-4 rounded shadow-inner text-sm text-gray-700 font-mono">
                      {analysisData.revised_prompt}
                    </div>
                    <button 
                      onClick={() => navigator.clipboard.writeText(analysisData.revised_prompt)}
                      className="mt-3 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Copy Revised Prompt
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">A revised system prompt will be generated after analysis.</p>
                )}
              </div>
            </section>
          )}

          {activeTab === 'history' && (
            <RewriteHistoryTab onRestoreFromHistory={handleRestoreFromHistory} />
          )}
        </div>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Powered by Google Gemini API & OpenAI GPT-4</p>
        </footer>
      </div>
    </div>
  )
}

export default App