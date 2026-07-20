import { authClient } from "@/lib/auth-client";
import Loader from "@/components/composites/loader";
import { AccountSection } from "./account-section";
import { StudyPreferencesSection } from "./study-preferences-section";
import { NotificationsSection } from "./notifications-section";
import { AppearanceSection } from "./appearance-section";
import { DangerZoneSection } from "./danger-zone-section";
import { SkillsSection } from "./skills-section";

const SECTIONS = [
  { id: "account", label: "Account" },
  { id: "skills", label: "Skills" },
  { id: "preferences", label: "Study Preferences" },
  { id: "notifications", label: "Notifications" },
  { id: "appearance", label: "Appearance" },
  { id: "danger", label: "Danger Zone" },
];

export function SettingsPage() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <Loader />;
  if (!session) return null;

  return (
    <div className="space-y-10 pb-10">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account, study preferences, and notifications.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <div className="space-y-12">
        <section id="account" className="scroll-mt-20">
          <AccountSection user={session.user} />
        </section>

        <section id="skills" className="scroll-mt-20">
          <SkillsSection />
        </section>

        <section id="preferences" className="scroll-mt-20">
          <StudyPreferencesSection />
        </section>

        <section id="notifications" className="scroll-mt-20">
          <NotificationsSection />
        </section>

        <section id="appearance" className="scroll-mt-20">
          <AppearanceSection />
        </section>

        <section id="danger" className="scroll-mt-20">
          <DangerZoneSection />
        </section>
      </div>
    </div>
  );
}

