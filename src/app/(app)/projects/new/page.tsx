import { Header } from "@/components/layout/header"
import { NewProjectForm } from "@/components/projects/new-project-form"

export default function NewProjectPage() {
  return (
    <>
      <Header title="New Project" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <NewProjectForm />
      </div>
    </>
  )
}
