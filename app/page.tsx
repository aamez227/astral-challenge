import { LessonForm } from "@/components/lesson-form";
import { LessonTable } from "@/components/lesson-table";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Digital Lessons</h1>
            <p className="text-muted-foreground mt-1">Generate interactive lessons with AI</p>
          </div>
          <ThemeSwitcher />
        </header>
        
        <div className="grid gap-8">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Create New Lesson</h2>
            <LessonForm />
          </section>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Generated Lessons</h2>
            <LessonTable />
          </section>
        </div>
      </div>
    </main>
  );
}
