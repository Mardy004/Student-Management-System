export type Role = "student" | "teacher";

/** users/{uid} ; profile data, separate from Firebase Auth's own record */
export interface UserProfile {
  uid: string;
  role: Role;
  fullName: string;
  email: string;
  photoURL?: string | null;
  createdAt: string; 
  // Student-only, optional fields
  grade?: string;
}

/** lessons/{lessonId} */
export interface Lesson {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  teacherName: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  location: string;
  link?: string;
  resources?: string; // free text / URLs, one per line
  // Which students this lesson applies to. Empty array = all students.
  studentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = "present" | "absent" | "excused";

/** attendance/{attendanceId} ; one record per (student, lesson) */
export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  lessonId: string;
  lessonTitle: string;
  date: string; // "YYYY-MM-DD", denormalized from the lesson for easy querying
  status: AttendanceStatus;
  markedAt: string;

  fromPermissionRequestId?: string;
}

export type PermissionStatus = "pending" | "approved" | "denied";

/** permissionRequests/{requestId} */
export interface PermissionRequest {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  lessonId: string;
  lessonTitle: string;
  date: string; // date of the lesson the request concerns
  reason: string;
  details?: string;
  status: PermissionStatus;
  createdAt: string;
  decidedAt?: string;
  decisionNote?: string;
}

/** marks/{markId} */
export interface Mark {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  lessonId?: string;
  subject: string;
  title: string; // e.g. "Homework 3"
  score: number;
  maxScore: number;
  feedback?: string;
  createdAt: string;
}

export type NotificationType =
  | "permission_approved"
  | "permission_denied"
  | "new_mark"
  | "new_feedback"
  | "lesson_created"
  | "lesson_updated"
  | "lesson_cancelled";

/** notifications/{notificationId} */
export interface AppNotification {
  id: string;
  userId: string; // recipient
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string; // e.g. lessonId, requestId, markId
}
