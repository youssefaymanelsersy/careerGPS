import { useState } from "react";
import type { CvOptimizationResponse, TemplateDesign } from "../types";

interface UseOptimizeCvResult {
  optimizeCv: (
    file: File | null,
    cvData: string | null,
    jobDescription: string,
    designPreference: TemplateDesign
  ) => Promise<CvOptimizationResponse>;
  isLoading: boolean;
  error: Error | null;
}

const API_URL = import.meta.env.VITE_AI_MICROSERVICE_URL;

export function useOptimizeCv(): UseOptimizeCvResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const optimizeCv = async (
    file: File | null,
    cvData: string | null,
    jobDescription: string,
    designPreference: TemplateDesign
  ): Promise<CvOptimizationResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      if (file) {
        formData.append("cv_file", file);
      } else if (cvData) {
        formData.append("cv_data", cvData);
      } else {
        throw new Error("Must provide either a CV file or CV JSON data.");
      }

      if (jobDescription) {
        formData.append("job_description", jobDescription);
      }
      formData.append("design_preference", designPreference);

      const response = await fetch(`${API_URL}/optimize`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to optimize CV");
      }

      const data: CvOptimizationResponse = await response.json();
      return data;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    } finally {
      setIsLoading(false);
    }
  };

  return { optimizeCv, isLoading, error };
}
