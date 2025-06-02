import { useState } from 'react'
import { rewriteEmail } from './api'
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">✉️ Smart Email Rewriter</h1>
          <p className="text-gray-600">Transform your emails with AI-powered tone adjustments</p>
        </header>
        
        <main className="bg-white rounded-lg shadow-md p-6">
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
        
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>Powered by Google Gemini API</p>
        </footer>
      </div>
    </div>
  )
}

export default App
