import React, { useState } from "react";
import type { TemplateDesign, ParsedCVData } from "../types";
import { useOptimizeCv } from "../api/useOptimizeCv";
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Layers, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExistingCvSelector } from "@/features/dashboard/components/existing-cv-selector";
import { trpc, queryClient } from "@/utils/trpc";
import { toast } from "sonner";

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
  const [activeTab, setActiveTab] = useState("upload");
  const [isFetchingExisting, setIsFetchingExisting] = useState(false);

  const [selectedExistingCvData, setSelectedExistingCvData] = useState<ParsedCVData | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setSelectedExistingCvData(null); // Clear existing if new file uploaded
    }
  };

  const handleUseExisting = async (cvUrl: string, cvId: string) => {
    try {
      setIsFetchingExisting(true);
      const res = await queryClient.fetchQuery(trpc.cv.getParsedData.queryOptions({ cvId }));
      if (res?.parsedData) {
        setSelectedExistingCvData(res.parsedData as ParsedCVData);
        setFile(null); // Clear file if existing selected
        toast.success("Existing CV ready. You can now generate your optimized CV.");
      } else {
        toast.error("Could not parse existing CV data.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load existing CV.");
    } finally {
      setIsFetchingExisting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !selectedExistingCvData && !parsedData) return;
    
    try {
      let dataToOptimize = null;
      if (!file) {
        dataToOptimize = JSON.stringify(selectedExistingCvData || parsedData);
      }
      const response = await optimizeCv(file, dataToOptimize, jd, design);
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
    setSelectedExistingCvData(null);
  };

  return (
    <div className="flex flex-col h-full bg-card overflow-y-auto">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 mb-1">
          CV Builder
        </h2>
        <p className="text-sm text-muted-foreground">AI-powered optimization</p>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-6">
        {/* Template Selector - Always visible */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold flex items-center gap-2">
            <Layers size={16} /> Template Design
          </label>
          <div className="flex flex-col gap-2">
            {(["classic", "modern", "minimalist"] as TemplateDesign[]).map((t) => (
              <button
                key={t}
                onClick={() => setDesign(t)}
                className={`py-3 px-4 rounded-xl text-sm font-medium capitalize transition-all duration-300 border text-left flex justify-between items-center ${
                  design === t 
                  ? "bg-primary/10 border-primary/50 text-primary shadow-sm" 
                  : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted hover:border-border"
                }`}
              >
                {t}
                {design === t && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
              </button>
            ))}
          </div>
        </div>

        {!parsedData ? (
          <div className="flex flex-col gap-6 mt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="upload">Upload New</TabsTrigger>
                <TabsTrigger value="existing">Use Existing</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="flex flex-col gap-4 mt-0 border-none p-0 outline-none focus:outline-none focus-visible:outline-none">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-xl cursor-pointer bg-muted/20 hover:bg-muted/50 transition-all duration-300 group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {file ? (
                      <>
                        <FileText className="w-8 h-8 mb-2 text-primary" />
                        <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                        <p className="mb-1 text-sm text-muted-foreground font-medium">Click or drag and drop</p>
                        <p className="text-xs text-muted-foreground/60">PDF up to 8MB</p>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                </label>
              </TabsContent>

              <TabsContent value="existing" className="mt-0 border-none p-0 outline-none focus:outline-none focus-visible:outline-none relative">
                {selectedExistingCvData && (
                  <div className="absolute inset-0 z-10 bg-card/80 backdrop-blur-sm flex items-center justify-center rounded-xl border border-primary/20">
                    <div className="flex flex-col items-center gap-2 text-primary">
                      <CheckCircle2 className="w-8 h-8" />
                      <span className="font-medium text-sm">Existing CV Selected</span>
                      <button 
                        onClick={() => setSelectedExistingCvData(null)}
                        className="text-xs text-muted-foreground hover:text-foreground mt-1 underline"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}
                <ExistingCvSelector 
                  onUseExisting={handleUseExisting} 
                  disabled={isLoading || isFetchingExisting || !!selectedExistingCvData} 
                />
              </TabsContent>
            </Tabs>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Target Job Description (Optional)</label>
                <textarea 
                  className="w-full bg-muted/30 border border-input rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all resize-none placeholder:text-muted-foreground/50"
                  rows={4}
                  placeholder="Paste the job description here..."
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl text-sm flex items-start gap-3">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={(!file && !selectedExistingCvData) || isLoading || isFetchingExisting}
                className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl py-4 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all duration-300 flex justify-center items-center gap-2 mt-2"
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
          </div>
        ) : (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
            {meta && (
              <div className="bg-green-500/10 text-green-700 dark:text-green-300 p-5 rounded-xl border border-green-500/20">
                <div className="flex items-center gap-2 mb-3 font-semibold text-green-600 dark:text-green-400">
                  <CheckCircle2 size={18} />
                  Optimization Complete
                </div>
                {meta.changes_summary?.length > 0 && (
                  <div className="mb-4 text-sm text-green-800/80 dark:text-green-200/80">
                    <ul className="list-disc pl-4 space-y-1">
                      {meta.changes_summary.map((c: string, i: number) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
                
                {(meta.unaddressed_gaps?.length > 0 || meta.warnings?.length > 0) && (
                  <div className="h-px w-full bg-green-500/20 my-3" />
                )}

                {meta.unaddressed_gaps?.length > 0 && (
                  <div className="mt-3 text-xs">
                    <strong className="text-amber-600 dark:text-amber-400/90 block mb-1">Gaps against Job Description:</strong>
                    <ul className="list-disc pl-4 text-amber-700/80 dark:text-amber-200/70 space-y-1">
                      {meta.unaddressed_gaps.map((g: string, i: number) => <li key={i}>{g}</li>)}
                    </ul>
                  </div>
                )}

                {meta.warnings?.length > 0 && (
                  <div className="mt-3 text-xs">
                    <strong className="text-amber-600 dark:text-amber-400/90 block mb-1">Warnings:</strong>
                    <ul className="list-disc pl-4 text-amber-700/80 dark:text-amber-200/70 space-y-1">
                      {meta.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="bg-muted/30 border rounded-xl p-5 text-sm text-muted-foreground">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-primary" /> Inline Editing Enabled
              </h3>
              <p className="leading-relaxed">
                You can now edit your CV directly on the live preview. Click any text to edit, and hover over sections to add or remove items.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors border hover:bg-muted rounded-xl flex justify-center items-center gap-2"
            >
              <RefreshCw size={16} /> Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
