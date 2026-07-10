import type { ResourceRow } from "@/lib/queries";
import { FileDown, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WorkbookCard({ resources }: { resources: ResourceRow[] }) {
  const workbook = resources.find((r) => r.type === "workbook");
  if (!workbook) return null;

  return (
    <div className="rounded-bloom-sm border border-border bg-white p-5 flex items-start gap-4 shadow-bloom-sm">
      {/* Cover thumbnail */}
      <div className="flex-shrink-0 w-16 h-20 rounded-lg bg-dawn-gradient-subtle border border-border flex items-center justify-center">
        <BookOpen className="size-7 text-bloom-rose/60" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <h4 className="font-display text-base text-botanical">{workbook.title}</h4>
        <p className="text-sm text-muted-foreground">
          Exercises and reflections for this section. Download to complete offline.
        </p>
        {workbook.file_url ? (
          <a href={workbook.file_url} target="_blank" rel="noopener noreferrer">
            <Button variant="gold" size="sm" className="mt-2 gap-2">
              <FileDown className="size-4" />
              Download
            </Button>
          </a>
        ) : (
          <Button variant="outline" size="sm" className="mt-2 gap-2" disabled>
            <FileDown className="size-4" />
            Coming soon
          </Button>
        )}
      </div>
    </div>
  );
}
