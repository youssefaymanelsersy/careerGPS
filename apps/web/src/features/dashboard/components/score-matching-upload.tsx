import { useState } from "react";
import {
	UploadIcon,
	ImageIcon,
	TypeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/ui/file-upload";
import type { ScoreMatchInput } from "../dashboard.service";
import { ExistingCvSelector } from "./existing-cv-selector";
import { useUploadCV } from "@/features/onboarding/onboarding.service";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/spinner";

type JobDescMode = "text" | "image";

interface ScoreMatchingUploadProps {
	onSubmit: (input: ScoreMatchInput) => void;
	disabled: boolean;
}

export function ScoreMatchingUpload({
	onSubmit,
	disabled,
}: ScoreMatchingUploadProps) {
	const [file, setFile] = useState<File | null>(null);
	const [cvUrl, setCvUrl] = useState<string | null>(null);
	const [cvMode, setCvMode] = useState<"upload" | "existing">("upload");

	const [mode, setMode] = useState<JobDescMode>("text");
	const [jobDescription, setJobDescription] = useState("");
	const [jobImage, setJobImage] = useState<File | null>(null);

	const uploadMutation = useUploadCV();
	const queryClient = useQueryClient();

	const handleSubmit = async () => {
		if ((!file && !cvUrl) || disabled || uploadMutation.isPending) return;
		const hasText = mode === "text" && jobDescription.trim().length > 0;
		const hasImage = mode === "image" && !!jobImage;
		if (!hasText && !hasImage) return;

		if (file) {
			try {
				await uploadMutation.mutateAsync(file);
				queryClient.invalidateQueries({ queryKey: trpc.cv.getLatestCV.queryKey() });
			} catch (err) {
				console.error("Failed to save CV to profile:", err);
			}
		}

		onSubmit({
			file: file ?? undefined,
			cvUrl: cvUrl ?? undefined,
			jobDescription: mode === "text" ? jobDescription : undefined,
			jobDescriptionImage: mode === "image" ? jobImage ?? undefined : undefined,
		});
	};

	const canSubmit =
		(!!file || !!cvUrl) &&
		!disabled &&
		(mode === "text" ? jobDescription.trim().length > 0 : !!jobImage);

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h2 className="text-2xl font-bold">Skill Matching</h2>
				<p className="text-muted-foreground mt-1">
					Upload your CV and a job description to see how well your skills
					match the role.
				</p>
			</div>

			{/* CV upload */}
			<div>
				<p className="text-sm font-medium mb-2">Candidate CV</p>
				<Tabs value={cvMode} onValueChange={(v) => {
					if (v === "upload" || v === "existing") setCvMode(v);
				}} className="w-full">
					<TabsList className="w-full grid grid-cols-2 mb-4">
						<TabsTrigger value="upload">Upload New</TabsTrigger>
						<TabsTrigger value="existing">Use Existing</TabsTrigger>
					</TabsList>
					
					<TabsContent value="upload" className="px-0 mt-0">
						<FileUpload
							accept=".pdf"
							maxSize={10 * 1024 * 1024}
							value={file}
							onChange={(f) => { setFile(f); if (f) setCvUrl(null); }}
							disabled={disabled}
							icon={UploadIcon}
							title="Drag & drop your CV here"
							subtitle="or click to browse — PDF only, up to 10MB"
						/>
					</TabsContent>
					
					<TabsContent value="existing" className="px-0 mt-0">
						<ExistingCvSelector 
							onUseExisting={(url) => { setCvUrl(url); setFile(null); }} 
							disabled={disabled} 
						/>
						{cvUrl && <p className="text-sm text-green-600 mt-3 font-medium">✓ Existing resume selected</p>}
					</TabsContent>
				</Tabs>
			</div>

			{/* Job description */}
			<div>
				<p className="text-sm font-medium mb-2">Job Description</p>
				<Tabs value={mode} onValueChange={(v) => {
					if (v === "text" || v === "image") setMode(v);
				}}>
					<TabsList className="w-96">
						<TabsTrigger value="text">
							<TypeIcon className="size-3.5" />
							Text
						</TabsTrigger>
						<TabsTrigger value="image">
							<ImageIcon className="size-3.5" />
							Image
						</TabsTrigger>
					</TabsList>

					<TabsContent value="text" className="px-0">
						<Textarea
							value={jobDescription}
							onChange={(e) => setJobDescription(e.target.value)}
							placeholder="Paste the full job description here..."
							className="min-h-48"
							disabled={disabled}
						/>
					</TabsContent>

					<TabsContent value="image" className="px-0">
					<FileUpload
						accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
						maxSize={10 * 1024 * 1024}
						value={jobImage}
						onChange={setJobImage}
						disabled={disabled}
						icon={ImageIcon}
						fileIcon={ImageIcon}
						title="Drop job description screenshot"
						subtitle="PNG, JPEG, or WEBP — up to 10MB"
					/>
					</TabsContent>
				</Tabs>
			</div>

			<Button
				size="lg"
				className="w-full"
				disabled={!canSubmit || uploadMutation.isPending}
				onClick={handleSubmit}
			>
				{uploadMutation.isPending ? (
					<>
						<Spinner className="mr-2" />
						Saving and Evaluating...
					</>
				) : (
					"Score Match"
				)}
			</Button>
		</div>
	);
}
