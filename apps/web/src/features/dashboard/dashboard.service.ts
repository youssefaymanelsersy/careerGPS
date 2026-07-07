import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function useAtsEvaluate() {
  const mutation = useMutation(trpc.ai.atsScore.mutationOptions({
    onError: (error) => {
      toast.error(error.message || "Failed to evaluate resume");

    }
  }))

  const atsScore = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file");
      throw new Error("Invalid file type");
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size must be under 10MB");
      throw new Error("File too large");
    }

    const fileBase64 = await fileToBase64(file);
    return mutation.mutateAsync({ fileBase64, fileName: file.name });
  };

  return {
    ...mutation,
    atsScore,
  };
}
