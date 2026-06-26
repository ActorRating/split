import Link from "next/link";
import { notFound } from "next/navigation";
import { BackgroundEffects } from "@/components/split/background-effects";
import { Footer } from "@/components/split/footer";
import { ArchivePollView } from "./archive-poll-view";
import { getPollByDate } from "@/lib/poll-service";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { date } = await params;
  return {
    title: `Split — Poll from ${date}`,
  };
}

export default async function PollArchivePage({ params }: PageProps) {
  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound();
  }

  const supabase = await createClient();
  if (!supabase) {
    notFound();
  }

  const poll = await getPollByDate(supabase, date);

  if (!poll) {
    notFound();
  }

  return (
    <div className="relative min-h-screen">
      <BackgroundEffects />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-[700px] flex-col justify-center px-5 py-16 sm:px-8 sm:py-24">
        <div className="space-y-8">
          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-white/30 transition-colors hover:text-white/60"
            >
              ← Back to today
            </Link>
            <p className="mt-4 text-xs uppercase tracking-widest text-white/25">
              {date}
            </p>
          </div>

          <ArchivePollView poll={poll} />

          <Footer />
        </div>
      </main>
    </div>
  );
}
