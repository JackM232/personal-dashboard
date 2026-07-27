import { Response } from "express";
import { prisma } from "../../lib/prisma";
import { ApplicationStatus, WorkMode, InterviewStage, InterviewFormat } from "../../generated/prisma";
import { AuthedRequest } from "../auth/middleware";

function isEnumValue<T extends Record<string, string>>(enumObj: T, value: unknown): value is T[keyof T] {
  return typeof value === "string" && value in enumObj;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const APPLIED_AT_MAX_AGE_MS = 2 * 365 * DAY_MS;

type ParsedAppliedAt =
  | { ok: true; value: Date | null | undefined }
  | { ok: false; error: string };

// A date-only string parses as UTC midnight, so allow a day of slack before
// calling it "future" — otherwise today's date rejects for users ahead of UTC.
function parseAppliedAt(value: unknown): ParsedAppliedAt {
  if (value === undefined) return { ok: true, value: undefined };
  if (value === null || value === "") return { ok: true, value: null };

  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "Invalid appliedAt" };
  }

  const now = Date.now();
  if (date.getTime() > now + DAY_MS) {
    return { ok: false, error: "appliedAt cannot be in the future" };
  }
  if (date.getTime() < now - APPLIED_AT_MAX_AGE_MS) {
    return { ok: false, error: "appliedAt is more than two years in the past" };
  }

  return { ok: true, value: date };
}

export async function listApplications(req: AuthedRequest, res: Response) {
  try {
    const applications = await prisma.internshipApplication.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: "desc" },
    });
    res.json(applications);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch applications" });
  }
}

export async function getApplication(req: AuthedRequest, res: Response) {
  try {
    const application = await prisma.internshipApplication.findFirst({
      where: { id: req.params.id as string, userId: req.user!.id },
    });
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }
    res.json(application);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch application" });
  }
}

export async function createApplication(req: AuthedRequest, res: Response) {
  const { company, position, location, workMode, url, source, appliedAt, status, notes } = req.body;

  if (!company || !position) {
    return res.status(400).json({ error: "company and position are required" });
  }
  if (status !== undefined && !isEnumValue(ApplicationStatus, status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  if (workMode !== undefined && workMode !== null && !isEnumValue(WorkMode, workMode)) {
    return res.status(400).json({ error: "Invalid workMode" });
  }

  const parsedAppliedAt = parseAppliedAt(appliedAt);
  if (!parsedAppliedAt.ok) {
    return res.status(400).json({ error: parsedAppliedAt.error });
  }
  const appliedAtValue = parsedAppliedAt.value;

  const stampApplied =
    status !== undefined && status !== ApplicationStatus.SAVED && !appliedAtValue;

  try {
    const application = await prisma.internshipApplication.create({
      data: {
        userId: req.user!.id,
        company,
        position,
        location,
        workMode: workMode ?? null,
        url,
        source,
        appliedAt: stampApplied ? new Date() : appliedAtValue,
        status,
        notes,
      },
    });
    res.status(201).json(application);
  }
  catch (err: any) {
    if (err.code === "P2003") {
      return res.status(400).json({ error: "Invalid userId" });
    }
    res.status(500).json({ error: "Failed to create application" });
  }
}

export async function updateApplication(req: AuthedRequest, res: Response) {
  const { company, position, location, workMode, url, source, appliedAt, status, notes } = req.body;

  if (status !== undefined && !isEnumValue(ApplicationStatus, status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  if (workMode !== undefined && workMode !== null && workMode !== "" && !isEnumValue(WorkMode, workMode)) {
    return res.status(400).json({ error: "Invalid workMode" });
  }

  const parsedAppliedAt = parseAppliedAt(appliedAt);
  if (!parsedAppliedAt.ok) {
    return res.status(400).json({ error: parsedAppliedAt.error });
  }
  const appliedAtValue = parsedAppliedAt.value;

  try {
    const existing = await prisma.internshipApplication.findFirst({
      where: { id: req.params.id as string, userId: req.user!.id },
      select: { appliedAt: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "Application not found" });
    }

    const nextAppliedAt = appliedAtValue === undefined ? existing.appliedAt : appliedAtValue;
    const stampApplied =
      status !== undefined && status !== ApplicationStatus.SAVED && !nextAppliedAt;

    const result = await prisma.internshipApplication.updateMany({
      where: { id: req.params.id as string, userId: req.user!.id },
      data: {
        company,
        position,
        location,
        workMode: workMode === "" ? null : workMode,
        url,
        source,
        appliedAt: stampApplied ? new Date() : appliedAtValue,
        status,
        notes,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to update application" });
  }
}

export async function deleteApplication(req: AuthedRequest, res: Response) {
  try {
    const result = await prisma.internshipApplication.deleteMany({
      where: { id: req.params.id as string, userId: req.user!.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to delete application" });
  }
}

// ─────────────────────────────────────────
// /api/interviews — scheduled interviews, scoped through their application
// ─────────────────────────────────────────

function parseScheduledAt(value: unknown): Date | undefined {
  if (typeof value !== "string" || value === "") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function listInterviews(req: AuthedRequest, res: Response) {
  try {
    const interviews = await prisma.interview.findMany({
      where: { application: { userId: req.user!.id } },
      include: { application: { select: { id: true, company: true, position: true } } },
      orderBy: { scheduledAt: "asc" },
    });
    res.json(interviews);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch interviews" });
  }
}

export async function createInterview(req: AuthedRequest, res: Response) {
  const { applicationId, scheduledAt, stage, format, interviewer, notes } = req.body;

  if (!applicationId || !scheduledAt) {
    return res.status(400).json({ error: "applicationId and scheduledAt are required" });
  }
  if (stage !== undefined && !isEnumValue(InterviewStage, stage)) {
    return res.status(400).json({ error: "Invalid stage" });
  }
  if (format !== undefined && format !== null && format !== "" && !isEnumValue(InterviewFormat, format)) {
    return res.status(400).json({ error: "Invalid format" });
  }

  const scheduledAtValue = parseScheduledAt(scheduledAt);
  if (!scheduledAtValue) {
    return res.status(400).json({ error: "Invalid scheduledAt" });
  }

  // Confirm the application is the caller's before attaching an interview to it —
  // otherwise a valid foreign key would let one user schedule onto another's row.
  const application = await prisma.internshipApplication.findFirst({
    where: { id: applicationId, userId: req.user!.id },
    select: { id: true },
  });
  if (!application) {
    return res.status(404).json({ error: "Application not found" });
  }

  try {
    const interview = await prisma.interview.create({
      data: {
        applicationId,
        scheduledAt: scheduledAtValue,
        stage,
        format: format || null,
        interviewer,
        notes,
      },
    });
    res.status(201).json(interview);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to create interview" });
  }
}

export async function updateInterview(req: AuthedRequest, res: Response) {
  const { scheduledAt, stage, format, interviewer, notes } = req.body;

  if (stage !== undefined && !isEnumValue(InterviewStage, stage)) {
    return res.status(400).json({ error: "Invalid stage" });
  }
  if (format !== undefined && format !== null && format !== "" && !isEnumValue(InterviewFormat, format)) {
    return res.status(400).json({ error: "Invalid format" });
  }

  let scheduledAtValue: Date | undefined;
  if (scheduledAt !== undefined) {
    scheduledAtValue = parseScheduledAt(scheduledAt);
    if (!scheduledAtValue) {
      return res.status(400).json({ error: "Invalid scheduledAt" });
    }
  }

  try {
    const result = await prisma.interview.updateMany({
      where: { id: req.params.id as string, application: { userId: req.user!.id } },
      data: {
        scheduledAt: scheduledAtValue,
        stage,
        format: format === "" ? null : format,
        interviewer,
        notes,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Interview not found" });
    }

    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to update interview" });
  }
}

export async function deleteInterview(req: AuthedRequest, res: Response) {
  try {
    const result = await prisma.interview.deleteMany({
      where: { id: req.params.id as string, application: { userId: req.user!.id } },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Interview not found" });
    }

    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to delete interview" });
  }
}
