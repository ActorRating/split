import { PollForm } from "@/components/admin/poll-form";

export default function CreatePollPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white/90">
          Create Poll
        </h1>
        <p className="mt-1 text-[0.875rem] text-white/38">
          New polls start as drafts. Assign a date to publish.
        </p>
      </div>

      <PollForm mode="create" />
    </div>
  );
}
