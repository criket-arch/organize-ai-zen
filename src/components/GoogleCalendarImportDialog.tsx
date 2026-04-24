import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseGoogleCalendarICS, ImportedTask } from "@/lib/googleCalendar";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (tasks: ImportedTask[]) => void;
}

export const GoogleCalendarImportDialog = ({ open, onOpenChange, onImport }: Props) => {
  const [source, setSource] = useState("");
  const [fileName, setFileName] = useState("");

  const handleImport = () => {
    try {
      const imported = parseGoogleCalendarICS(source);
      if (!imported.length) {
        toast.error("No events found in the calendar file.");
        return;
      }
      onImport(imported);
      setSource("");
      setFileName("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Could not parse the calendar file. Try exporting a fresh .ics file.");
      console.error(error);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    setSource(text);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Google Calendar</DialogTitle>
          <DialogDescription>
            Paste a Google Calendar .ics export or upload the file to turn events into tasks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="calendar-file">Calendar file</Label>
            <Input id="calendar-file" type="file" accept=".ics" onChange={handleFileChange} />
            {fileName && <p className="text-sm text-muted-foreground">Loaded: {fileName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="calendar-source">Or paste ICS content</Label>
            <Textarea
              id="calendar-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="BEGIN:VCALENDAR\n..."
              rows={8}
            />
          </div>

          <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
            Pro tip: in Google Calendar, go to Settings &gt; Import &amp; export, export a calendar, then upload the .ics file here.
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="hero" onClick={handleImport} disabled={!source.trim()}>
            Import events
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
