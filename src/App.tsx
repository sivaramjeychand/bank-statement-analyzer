import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { extractTextFromPDF } from './utils/pdfParser';
import { parseDBSStatement } from './utils/dbsParser';
import { analyzeTransactions } from './utils/analyzer';
import type { MonthlySummary } from './types';

function App() {
  const [summary, setSummary] = useState<MonthlySummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data from localStorage on mount
  useState(() => {
    const savedData = localStorage.getItem('bankStatementData');
    if (savedData) {
      try {
        setSummary(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to load saved data", e);
      }
    }
  });

  const handleFileUpload = async (files: File[]) => {
    setLoading(true);
    setError(null);
    try {
      let allTransactions: any[] = [];

      for (const file of files) {
        const textPages = await extractTextFromPDF(file);
        const fullText = textPages.join('\n');
        const transactions = parseDBSStatement(fullText);
        allTransactions = [...allTransactions, ...transactions];
      }

      if (allTransactions.length === 0) {
        setError("No transactions found in the uploaded files. Please ensure they are valid DBS PDF statements.");
        setLoading(false);
        return;
      }

      const analyzedData = analyzeTransactions(allTransactions);
      setSummary(analyzedData);
      localStorage.setItem('bankStatementData', JSON.stringify(analyzedData));
    } catch (err) {
      console.error(err);
      setError("Failed to parse one or more files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSummary(null);
    setError(null);
    localStorage.removeItem('bankStatementData');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Bank Statement Analyzer
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Securely analyze your DBS monthly statements.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : !summary ? (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm">
            <FileUpload onFileUpload={handleFileUpload} />
          </div>
        ) : (
          <div>
            <div className="flex justify-end mb-4 space-x-4">
              <button
                onClick={handleReset}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Clear Data
              </button>
            </div>
            <Dashboard summary={summary} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
