import React, { useState } from "react";
import type { TemplateDesign, ParsedCVData } from "../types";
import { useOptimizeCv } from "../api/useOptimizeCv";
import { CvEditor } from "./CvEditor";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  design: TemplateDesign;
  setDesign: (d: TemplateDesign) => void;
  parsedData: ParsedCVData | null;
  setParsedData: (data: ParsedCVData | null) => void;
  meta: any;
  setMeta: (meta: any) => void;
}

export function CvControls({ design, setDesign, parsedData, setParsedData, meta, setMeta }: Props) {
  const { optimizeCv, isLoading, error } = useOptimizeCv();
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !parsedData) return;
    
    try {
      const response = await optimizeCv(file, null, jd, design);
      setParsedData(response.data);
      setMeta(response.meta);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = () => {
    setParsedData(null);
    setMeta(null);
    setFile(null);
    setJd("");
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">CV Builder</h2>
        <p className="text-sm text-gray-500">AI-powered optimization & styling</p>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-6">
        {/* Template Selector - Always visible */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Template Design</label>
          <div className="flex gap-2">
            {(["classic", "modern", "minimalist"] as TemplateDesign[]).map((t) => (
              <button
                key={t}
                onClick={() => setDesign(t)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all ${
                  design === t 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {!parsedData ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Upload CV (PDF)</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {file ? (
                    <>
                      <FileText className="w-8 h-8 mb-2 text-blue-500" />
                      <p className="text-sm text-gray-700 font-medium">{file.name}</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-1 text-sm text-gray-500 font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-400">PDF up to 8MB</p>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Target Job Description (Optional)</label>
              <textarea 
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                rows={4}
                placeholder="Paste the job description here to optimize your CV against it..."
                value={jd}
                onChange={(e) => setJd(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error.message}
              </div>
            )}

            <button
              type="submit"
              disabled={!file || isLoading}
              className="w-full bg-black text-white rounded-xl py-3 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing CV...
                </>
              ) : (
                "Generate Optimized CV"
              )}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {meta && (
              <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-2 font-semibold">
                  <CheckCircle2 size={18} className="text-green-600" />
                  CV Optimized Successfully
                </div>
                {meta.changes_summary?.length > 0 && (
                  <div className="mb-2 text-sm text-green-700">
                    <ul className="list-disc pl-4 mt-1">
                      {meta.changes_summary.map((c: string, i: number) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
                
                {meta.unaddressed_gaps?.length > 0 && (
                  <div className="mt-3 text-xs">
                    <strong className="text-amber-700">Gaps against Job Description:</strong>
                    <ul className="list-disc pl-4 text-amber-700 mt-1">
                      {meta.unaddressed_gaps.map((g: string, i: number) => <li key={i}>{g}</li>)}
                    </ul>
                  </div>
                )}

                {meta.warnings?.length > 0 && (
                  <div className="mt-3 text-xs">
                    <strong className="text-amber-700">Warnings:</strong>
                    <ul className="list-disc pl-4 text-amber-700 mt-1">
                      {meta.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <CvEditor data={parsedData} onChange={setParsedData} />

            <button
              onClick={handleReset}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Start Over with New CV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
