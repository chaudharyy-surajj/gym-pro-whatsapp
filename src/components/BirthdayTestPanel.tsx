"use client";

import { useState } from "react";

export default function BirthdayTestPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [method, setMethod] = useState<"CONSOLE" | "WHATSAPP">("CONSOLE");
  const [testDate, setTestDate] = useState("");

  const handleTrigger = async () => {
    setLoading(true);
    setResult(null);

    try {
      const params = new URLSearchParams();
      params.append("method", method);
      if (testDate) {
        params.append("testDate", testDate);
      }

      const response = await fetch(`/api/birthday-check?${params.toString()}`);
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        🎂 Birthday Test Panel
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Delivery Method
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as "CONSOLE" | "WHATSAPP")}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="CONSOLE">Console (Testing)</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Test Date (Optional - Override Today)
          </label>
          <input
            type="date"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Leave empty for today"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Use this to test birthdays on specific dates without waiting
          </p>
        </div>

        <button
          onClick={handleTrigger}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Checking..." : "🎉 Trigger Birthday Check"}
        </button>

        {result && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Result:
            </h3>
            <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
