import * as z from "zod";

export const StudentProgressResult = z.enum(["pass", "fail", "pending"]);

export const StudentProgressReportRowSchema = z.object({
  row_id: z.string(),
  student_id: z.number(),
  student_code: z.string().nullable(),
  student_name: z.string(),
  father_name: z.string().nullable(),
  phone_number: z.string().nullable(),
  email: z.string().nullable(),
  student_status: z.string().nullable(),
  registered_at: z.string().nullable(),
  enrollment_id: z.number().nullable(),
  class_id: z.number().nullable(),
  class_code: z.string().nullable(),
  class_name: z.string().nullable(),
  class_type: z.string().nullable(),
  course_id: z.number().nullable(),
  course_title: z.string().nullable(),
  module_title: z.string().nullable(),
  model: z.string().nullable(),
  main_category: z.string().nullable(),
  sub_category: z.string().nullable(),
  grade: z.string().nullable(),
  marks: z.string().nullable(),
  final_score: z.number().nullable(),
  result: StudentProgressResult.nullable(),
  enrollment_date: z.string().nullable(),
  enrollment_status: z.string().nullable(),
  attendance_present: z.number(),
  attendance_absent: z.number(),
  attendance_leave: z.number(),
  attendance_rate: z.number().nullable(),
});

export type StudentProgressReportRow = z.infer<typeof StudentProgressReportRowSchema>;

export const ReportFilterOptionSchema = z.object({
  id: z.number(),
  title: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  class_code: z.string().nullable().optional(),
});

export type ReportFilterOption = z.infer<typeof ReportFilterOptionSchema>;
