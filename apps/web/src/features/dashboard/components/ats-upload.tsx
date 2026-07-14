import { useState } from "react";
import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ExistingCvSelector } from "./existing-cv-selector";

import { useUploadCV } from "@/features/onboarding/onboarding.service";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/spinner";

interface AtsUploadProps {
  onSubmit: (data: { file?: File, cvUrl?: string }) => void;
  disabled: boolean;
}

export function AtsUpload({ onSubmit, disabled }: AtsUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const uploadMutation = useUploadCV();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!file || disabled || uploadMutation.isPending) return;
    
    try {
      await uploadMutation.mutateAsync(file);
      queryClient.invalidateQueries({ queryKey: trpc.cv.getLatestCV.queryKey() });
      onSubmit({ file });
    } catch (err) {
      // The error is already toasted by useUploadCV
      console.error("Failed to save CV to profile:", err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">ATS Resume Scanner</h2>
        <p className="text-muted-foreground mt-1">
          Upload your resume to check how well it performs against Applicant Tracking Systems.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="upload">Upload New</TabsTrigger>
          <TabsTrigger value="existing">Use Existing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="flex flex-col gap-4 mt-0 border-none p-0 outline-none focus:outline-none focus-visible:outline-none">
          <FileUpload
            accept=".pdf"
            maxSize={10 * 1024 * 1024}
            value={file}
            onChange={setFile}
            disabled={disabled}
            icon={UploadIcon}
            title="Drag & drop your resume here"
            subtitle="or click to browse — PDF only, up to 10MB"
          />
          <Button
            size="lg"
            className="w-full"
            disabled={!file || disabled || uploadMutation.isPending}
            onClick={handleSubmit}
          >
            {uploadMutation.isPending ? (
              <>
                <Spinner className="mr-2" />
                Saving and Evaluating...
              </>
            ) : (
              "Evaluate Resume"
            )}
          </Button>
        </TabsContent>
        
        <TabsContent value="existing" className="mt-0 border-none p-0 outline-none focus:outline-none focus-visible:outline-none">
          <ExistingCvSelector 
            onUseExisting={(url) => onSubmit({ cvUrl: url })} 
            disabled={disabled} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
