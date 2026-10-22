import {
  ClipboardCheck,
  Download,
  File,
  FileArchive,
  FileCode,
  FileDown,
  FileImage,
  FileQuestionMark,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import type {
  CourseLearnFile,
  CourseLearnLesson,
  CourseLearnMockTest,
  CourseLearnQuizFile,
} from "@/hooks/useStudentLearning";

type FileKind = "pdf" | "excel" | "word" | "powerpoint" | "archive" | "image" | "code" | "other";

type FileVisual = {
  kind: FileKind;
  Icon: LucideIcon;
  iconClass: string;
  wrapClass: string;
};

const FILE_VISUALS: Record<FileKind, Omit<FileVisual, "kind">> = {
  pdf: { Icon: FileText, iconClass: "text-red-600", wrapClass: "bg-red-600/10" },
  excel: { Icon: FileSpreadsheet, iconClass: "text-emerald-600", wrapClass: "bg-emerald-600/10" },
  word: { Icon: FileText, iconClass: "text-blue-600", wrapClass: "bg-blue-600/10" },
  powerpoint: { Icon: FileText, iconClass: "text-orange-600", wrapClass: "bg-orange-600/10" },
  archive: { Icon: FileArchive, iconClass: "text-amber-600", wrapClass: "bg-amber-600/10" },
  image: { Icon: FileImage, iconClass: "text-violet-600", wrapClass: "bg-violet-600/10" },
  code: { Icon: FileCode, iconClass: "text-slate-600", wrapClass: "bg-slate-600/10" },
  other: { Icon: File, iconClass: "text-muted-foreground", wrapClass: "bg-muted" },
};

function extensionOf(file: {
  title?: string | null;
  download_url?: string | null;
  file_extension?: string | null;
}): string {
  const fromApi = file.file_extension?.trim().toLowerCase();
  if (fromApi) return fromApi.replace(/^\./, "");

  const candidates = [file.download_url, file.title];
  for (const value of candidates) {
    if (!value) continue;
    const path = value.split("?")[0] ?? value;
    const match = /\.([a-z0-9]{1,8})$/i.exec(path);
    if (match?.[1]) return match[1].toLowerCase();
  }
  return "";
}

function fileVisual(file: {
  title?: string | null;
  download_url?: string | null;
  file_extension?: string | null;
}): FileVisual {
  const ext = extensionOf(file);
  let kind: FileKind = "other";
  if (ext === "pdf") kind = "pdf";
  else if (["xls", "xlsx", "csv", "ods"].includes(ext)) kind = "excel";
  else if (["doc", "docx", "rtf", "odt"].includes(ext)) kind = "word";
  else if (["ppt", "pptx", "odp"].includes(ext)) kind = "powerpoint";
  else if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) kind = "archive";
  else if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext)) kind = "image";
  else if (["js", "ts", "tsx", "json", "html", "css", "py", "php", "sql"].includes(ext)) kind = "code";

  return { kind, ...FILE_VISUALS[kind] };
}

function formatFileSize(bytes: number | null | undefined): string | null {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return null;
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
  const gb = mb / 1024;
  return `${gb < 10 ? gb.toFixed(1) : Math.round(gb)} GB`;
}

function plainText(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function LearnFileCard({ file }: { file: CourseLearnFile | CourseLearnQuizFile | CourseLearnMockTest }) {
  const visual = fileVisual(file);
  const sizeLabel = formatFileSize(file.file_size);
  const ext = extensionOf(file);
  const Icon = visual.Icon;
  const body = (
    <>
      <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", visual.wrapClass)}>
        <Icon className={cn("h-7 w-7", visual.iconClass)} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground" title={file.title}>
          {file.title}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {sizeLabel ?? (ext ? ext.toUpperCase() : "—")}
        </span>
      </span>
      <Download className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
    </>
  );

  if (file.download_url) {
    return (
      <a
        href={file.download_url}
        target="_blank"
        rel="noreferrer"
        className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
      >
        {body}
      </a>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-dashed border-border bg-card/60 p-4 opacity-70">
      {body}
    </div>
  );
}

function LearnFileGrid({ files, empty }: { files: Array<CourseLearnFile | CourseLearnQuizFile | CourseLearnMockTest>; empty: string }) {
  if (files.length === 0) {
    return <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {files.map((file) => (
        <li key={file.id}>
          <LearnFileCard file={file} />
        </li>
      ))}
    </ul>
  );
}

type LearnLessonTabsProps = {
  lesson: CourseLearnLesson | null;
  chapterTitle: string;
  chapterFiles: CourseLearnFile[];
  resources: CourseLearnFile[];
  mockTests: CourseLearnMockTest[];
  quizFiles: CourseLearnQuizFile[];
};

const LearnLessonTabs = ({
  lesson,
  chapterTitle,
  chapterFiles,
  resources,
  mockTests,
  quizFiles,
}: LearnLessonTabsProps) => {
  const { t } = useTranslation();
  const description = plainText(lesson?.description);
  const chapterTabLabel = t("coursePlayer.chapterFilesTab").replace("{name}", chapterTitle);

  return (
    <Tabs defaultValue="overview" className="flex w-full flex-col gap-4">
      <TabsList
        variant="default"
        className="h-auto w-fit max-w-full flex-none flex-wrap justify-start gap-0.5 rounded-lg border border-border bg-muted p-0.5 my-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <TabsTrigger
          value="overview"
          className="h-7 flex-none gap-1 rounded-md px-2.5 py-0 text-xs data-active:text-primary [&_svg]:text-primary"
        >
          <LayoutDashboard className="size-3.5 text-primary" />
          {t("coursePlayer.overviewTab")}
        </TabsTrigger>
        <TabsTrigger
          value="chapter"
          className="h-7 flex-none gap-1 rounded-md px-2.5 py-0 text-xs data-active:text-warning [&_svg]:text-warning"
        >
          <FolderOpen className="size-3.5 text-warning" />
          {chapterTabLabel}
        </TabsTrigger>
        <TabsTrigger
          value="resources"
          className="h-7 flex-none gap-1 rounded-md px-2.5 py-0 text-xs data-active:text-success [&_svg]:text-success"
        >
          <FileDown className="size-3.5 text-success" />
          {t("coursePlayer.resourcesTab")}
        </TabsTrigger>
        <TabsTrigger
          value="mock"
          className="h-7 flex-none gap-1 rounded-md px-2.5 py-0 text-xs data-active:text-auxiliary [&_svg]:text-auxiliary"
        >
          <ClipboardCheck className="size-3.5 text-auxiliary" />
          {t("coursePlayer.mockTestsTab")}
        </TabsTrigger>
        <TabsTrigger
          value="quiz"
          className="h-7 flex-none gap-1 rounded-md px-2.5 py-0 text-xs data-active:text-danger [&_svg]:text-danger"
        >
          <FileQuestionMark className="size-3.5 text-danger" />
          {t("coursePlayer.quizFilesTab")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="w-full pt-0">
        <Card className="border-border/80 shadow-none">
          <CardHeader className="gap-1 p-2 sm:p-4">
            <CardTitle className="text-md font-semibold tracking-tight sm:text-2xl">
              {lesson?.title ?? t("coursePlayer.lessonFallback")}
            </CardTitle>
            {description ? (
              <CardDescription className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {description}
              </CardDescription>
            ) : (
              <CardDescription className="text-sm text-muted-foreground">{t("coursePlayer.noDescription")}</CardDescription>
            )}
          </CardHeader>
        </Card>
      </TabsContent>

      <TabsContent value="chapter" className="w-full pt-0">
        <LearnFileGrid files={chapterFiles} empty={t("coursePlayer.chapterFilesEmpty")} />
      </TabsContent>

      <TabsContent value="resources" className="w-full pt-0">
        <LearnFileGrid files={resources} empty={t("coursePlayer.resourcesEmpty")} />
      </TabsContent>

      <TabsContent value="mock" className="w-full pt-0">
        <LearnFileGrid files={mockTests} empty={t("coursePlayer.mockTestsEmpty")} />
      </TabsContent>

      <TabsContent value="quiz" className="w-full pt-0">
        <LearnFileGrid files={quizFiles} empty={t("coursePlayer.quizFilesEmpty")} />
      </TabsContent>
    </Tabs>
  );
};

export default LearnLessonTabs;
