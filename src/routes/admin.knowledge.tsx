import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { knowledgeService } from "@/api/services";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingBlock } from "@/components/common/Loading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import type { KnowledgeDocument, Vertical } from "@/api/types";

export const Route = createFileRoute("/admin/knowledge")({
  component: KnowledgeBase,
});

function KnowledgeBase() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["kdocs"],
    queryFn: () => knowledgeService.list({ limit: 50 }),
    refetchInterval: 3000,
  });
  const upload = useMutation({
    mutationFn: (doc: Partial<KnowledgeDocument>) => knowledgeService.upload(doc),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kdocs"] });
      setOpen(false);
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => knowledgeService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kdocs"] }),
  });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [vertical, setVertical] = useState<Vertical>("AUTOMOTIVE");

  if (isLoading) return <LoadingBlock />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">Documents that feed the AI advisor (RAG).</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1"><Upload className="h-4 w-4" /> Upload document</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload knowledge document</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>File name</Label>
                <Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="document.pdf" />
              </div>
              <div className="grid gap-1.5">
                <Label>Vertical</Label>
                <Select value={vertical} onValueChange={(v) => setVertical(v as Vertical)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["AUTOMOTIVE", "REAL_ESTATE", "INSURANCE", "FINANCING", "SOLAR", "CONSTRUCTION", "PROFESSIONAL_SERVICES"] as const).map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button disabled={!title || !fileName || upload.isPending} onClick={() => upload.mutate({ title, fileName, vertical, fileType: "PDF", sizeBytes: 1024 * 1024 })}>
                {upload.isPending ? "Uploading…" : "Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Vertical</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Chunks</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="font-medium">{d.title}</div>
                    <div className="text-xs text-muted-foreground">{d.fileName}</div>
                  </TableCell>
                  <TableCell>{d.vertical}</TableCell>
                  <TableCell>{d.fileType}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === "INDEXED" ? "default" : d.status === "PROCESSING" ? "secondary" : "destructive"}>
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{d.chunkCount ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(d.createdAt)}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(d.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
