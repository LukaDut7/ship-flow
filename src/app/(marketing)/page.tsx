import Link from "next/link"
import { Button } from "@/components/ui/button"

const FEATURES = [
  {
    title: "Lifecycle-Organized Docs",
    description:
      "Structure your project knowledge by phase from ideation to iteration. Nothing falls through the cracks.",
  },
  {
    title: "Guided Templates",
    description:
      "15 templates with guiding questions to help you capture the right information at the right time.",
  },
  {
    title: "Context-Rich Prompts",
    description:
      "Generate prompts for any AI tool. One click to copy, paste, and get dramatically better output.",
  },
  {
    title: "Tool-Agnostic",
    description:
      "Works with Cursor, Claude, ChatGPT, and more. Use your favorite AI tools without switching workflows.",
  },
  {
    title: "Context Compounds",
    description:
      "Project knowledge grows over time. Every AI interaction gets smarter because ShipFlow remembers what you decided and why.",
  },
  {
    title: "Export Anywhere",
    description:
      "Export to .cursorrules, Claude Projects, or plain markdown. Your context travels with you.",
  },
]

const STEPS = [
  {
    step: 1,
    title: "Organize",
    description:
      "Create a project and add documents using guided templates. Structure everything by lifecycle phase.",
  },
  {
    step: 2,
    title: "Generate",
    description:
      "Turn your docs into context-rich prompts. Pick your AI tool format and copy with one click.",
  },
  {
    step: 3,
    title: "Ship",
    description:
      "Paste into Cursor, Claude, or ChatGPT. Get better results every time as your project context compounds.",
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <span className="text-xl font-bold">ShipFlow</span>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center px-4 py-20 text-center sm:py-28">
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            The project brain behind your AI tools
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            ShipFlow stores your decisions, specs, and project knowledge — then
            generates context-rich prompts for Cursor, Claude, ChatGPT, and any
            AI tool you use. Every interaction builds on everything that came
            before.
          </p>
          <div className="mt-10 flex gap-4">
            <Link href="/login">
              <Button size="lg">Get Started Free</Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/30 py-16 sm:py-24">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything you need to ship with AI
            </h2>
            <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border bg-card p-6 shadow-sm transition-colors hover:bg-accent/50"
                >
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
              How It Works
            </h2>
            <div className="mx-auto grid max-w-3xl gap-10 sm:grid-cols-3">
              {STEPS.map((item) => (
                <div key={item.step} className="relative text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t py-16 sm:py-20">
          <div className="container mx-auto px-4 text-center">
            <p className="text-lg text-muted-foreground">
              Ready to ship smarter with AI?
            </p>
            <div className="mt-6">
              <Link href="/login">
                <Button size="lg">Get Started Free</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} ShipFlow. Ship smarter.
      </footer>
    </div>
  )
}
