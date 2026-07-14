import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import {
  Button,
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  StepperPrev,
} from "@/components/ui/stepper";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Spinner } from "@/components/ui/spinner";
import { useGetAllRoles } from "@/features/onboarding/onboarding.service";

interface CareerStepProps {
  onComplete: (roleId: string) => void;
  onFinish: () => void;
  isFinishing: boolean;
}

export function CareerStep({ onComplete, onFinish, isFinishing }: CareerStepProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const rolesQuery = useGetAllRoles(true);

  const handleChange = (value: string) => {
    setSelectedRoleId(value);
    onComplete(value);
  };

  if (rolesQuery.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const roles = (rolesQuery.data ?? []) as Array<{
    id: string;
    title: string;
    description?: string | null;
    score?: number;
  }>;

  if (roles.length === 0) {
    return (
      <Card className="w-full max-w-xl mx-auto h-125 flex flex-col">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Choose Your Career
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-center text-muted-foreground">
              No careers available at the moment.
            </p>
          </div>
          <div className="flex justify-start gap-2 mt-6">
            <StepperPrev render={<Button variant="secondary" />}>Previous Step</StepperPrev>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedRoles = [...roles].sort(
    (a, b) => (b.score ?? 0) - (a.score ?? 0),
  );

  return (
    <Card className="w-full max-w-xl mx-auto h-125 flex flex-col">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          Choose Your Career
        </CardTitle>
        <CardDescription className="text-center">
          Select the career path you want to pursue
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-4">
            <RadioGroup
              value={selectedRoleId ?? ""}
              onValueChange={handleChange}
              variant="secondary"
              className="gap-2"
            >
            {sortedRoles.map((role) => (
              <Collapsible key={role.id} className="w-full">
                <FieldLabel htmlFor={`role-${role.id}`}>
                  <Field orientation="horizontal" className="w-full">
                    <FieldContent>

                      <FieldTitle>{role.description && (
                        <CollapsibleTrigger className="group/trigger p-1">
                          <ChevronDownIcon className="size-4 transition-transform duration-200 group-aria-expanded/trigger:rotate-180" />
                        </CollapsibleTrigger>
                      )}{role.title}</FieldTitle>
                    </FieldContent>
                    <div className="flex items-center gap-1">

                      <RadioGroupItem value={role.id} id={`role-${role.id}`} />
                    </div>
                  </Field>
                </FieldLabel>
                {role.description && (
                  <CollapsibleContent className="px-5 pb-3">
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                  </CollapsibleContent>
                )}
              </Collapsible>
            ))}
            </RadioGroup>
          </ScrollArea>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <StepperPrev render={<Button variant="secondary" />}>Previous Step</StepperPrev>
        <Button
          onClick={onFinish}
          disabled={isFinishing || !selectedRoleId}
          className="min-w-32"
        >
          {isFinishing ? (
            <>
              <Spinner /> Saving...
            </>
          ) : (
            "Finish"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
