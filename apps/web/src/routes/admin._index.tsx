import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, BookOpen, Wrench, Users } from "lucide-react";
import { Link } from "react-router";

export default function AdminDashboard() {
  const cards = [
    {
      title: "Roles",
      description: "Manage system roles and their required skills",
      icon: Users,
      href: "/admin/roles",
      color: "text-blue-500",
    },
    {
      title: "Skills",
      description: "Manage the master skills dictionary",
      icon: Wrench,
      href: "/admin/skills",
      color: "text-orange-500",
    },
    {
      title: "Curriculum",
      description: "Manage learning paths and nodes",
      icon: BookOpen,
      href: "/admin/curriculum",
      color: "text-green-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-2">
          Welcome to the admin control panel. Here you can manage the core data of the platform.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.title} to={card.href} className="block group">
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold">{card.title}</CardTitle>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{card.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
