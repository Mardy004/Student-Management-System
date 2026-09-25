import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  UserProfile,
  Lesson,
  AttendanceRecord,
  AttendanceStatus,
  PermissionRequest,
  PermissionStatus,
  Mark,
  AppNotification,
  NotificationType,
} from "@/types";

const nowIso = () => new Date().toISOString();

/* Users                                                               */

export async function createUserProfile(profile: UserProfile) {
  await setDoc(doc(db, "users", profile.uid), profile);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function getAllStudents(): Promise<UserProfile[]> {
  const q = query(collection(db, "users"), where("role", "==", "student"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserProfile);
}

/* Lessons                                                             */

export async function createLesson(
  lesson: Omit<Lesson, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "lessons"), {
    ...lesson,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  return ref.id;
}

export async function updateLesson(id: string, data: Partial<Lesson>) {
  await updateDoc(doc(db, "lessons", id), { ...data, updatedAt: nowIso() });
}

export async function deleteLesson(id: string) {
  await deleteDoc(doc(db, "lessons", id));
}

export async function getLesson(id: string): Promise<Lesson | null> {
  const snap = await getDoc(doc(db, "lessons", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Lesson) : null;
}

/** Lessons a teacher created. Filtered server-side by teacherId  */
export async function getLessonsForTeacher(teacherId: string): Promise<Lesson[]> {
  const q = query(
    collection(db, "lessons"),
    where("teacherId", "==", teacherId),
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Lesson));
}

export async function getLessonsForStudent(studentId: string): Promise<Lesson[]> {
  const assignedQ = query(
    collection(db, "lessons"),
    where("studentIds", "array-contains", studentId)
  );
  const openQ = query(collection(db, "lessons"), where("studentIds", "==", []));
  const [assignedSnap, openSnap] = await Promise.all([getDocs(assignedQ), getDocs(openQ)]);
  const map = new Map<string, Lesson>();
  [...assignedSnap.docs, ...openSnap.docs].forEach((d) => {
    map.set(d.id, { id: d.id, ...d.data() } as Lesson);
  });
  return Array.from(map.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
}

/* Attendance                                                          */

export async function markAttendance(
  record: Omit<AttendanceRecord, "id" | "markedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "attendance"), {
    ...record,
    markedAt: nowIso(),
  });
  return ref.id;
}

export async function updateAttendanceStatus(
  id: string,
  status: AttendanceStatus,
  fromPermissionRequestId?: string
) {
  await updateDoc(doc(db, "attendance", id), {
    status,
    markedAt: nowIso(),
    ...(fromPermissionRequestId ? { fromPermissionRequestId } : {}),
  });
}

export async function getAttendanceForStudent(studentId: string): Promise<AttendanceRecord[]> {
  const q = query(
    collection(db, "attendance"),
    where("studentId", "==", studentId),
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord));
}

export async function getAttendanceForLesson(lessonId: string): Promise<AttendanceRecord[]> {
  const q = query(collection(db, "attendance"), where("lessonId", "==", lessonId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord));
}

/** Find the (student, lesson) attendance record if one already exists ;
 used so we don't create duplicate records when a permission decision
 needs to update attendance. */

export async function findAttendanceRecord(
  studentId: string,
  lessonId: string
): Promise<AttendanceRecord | null> {
  const q = query(
    collection(db, "attendance"),
    where("studentId", "==", studentId),
    where("lessonId", "==", lessonId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as AttendanceRecord;
}

/** Create-or-update the attendance record for a (student, lesson) pair. */
export async function upsertAttendance(input: {
  studentId: string;
  studentName: string;
  teacherId: string;
  lessonId: string;
  lessonTitle: string;
  date: string;
  status: AttendanceStatus;
}) {
  const existing = await findAttendanceRecord(input.studentId, input.lessonId);
  if (existing) {
    await updateAttendanceStatus(existing.id, input.status);
  } else {
    await markAttendance(input);
  }
}

/* Permission requests                                                 */

export async function createPermissionRequest(
  req: Omit<PermissionRequest, "id" | "status" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "permissionRequests"), {
    ...req,
    status: "pending" as PermissionStatus,
    createdAt: nowIso(),
  });
  return ref.id;
}

export async function getPermissionRequestsForStudent(
  studentId: string
): Promise<PermissionRequest[]> {
  const q = query(
    collection(db, "permissionRequests"),
    where("studentId", "==", studentId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PermissionRequest));
}

export async function getPermissionRequestsForTeacher(
  teacherId: string
): Promise<PermissionRequest[]> {
  const q = query(
    collection(db, "permissionRequests"),
    where("teacherId", "==", teacherId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PermissionRequest));
}

/**
 * Approve or deny a permission request, and propagate the decision to
 * attendance + notify the student. This is the one place that encodes the
 * business rule described in the project brief:
 *   - Approved  -> attendance status becomes "excused"
 *   - Denied    -> attendance status becomes "absent"
 * If no attendance record exists yet for that (student, lesson) pair, one
 * is created; otherwise the existing record is updated.
 */
export async function decidePermissionRequest(
  request: PermissionRequest,
  decision: Exclude<PermissionStatus, "pending">,
  decisionNote?: string
) {
  await updateDoc(doc(db, "permissionRequests", request.id), {
    status: decision,
    decidedAt: nowIso(),
    ...(decisionNote ? { decisionNote } : {}),
  });

  const resultingStatus: AttendanceStatus = decision === "approved" ? "excused" : "absent";
  const existing = await findAttendanceRecord(request.studentId, request.lessonId);
  if (existing) {
    await updateAttendanceStatus(existing.id, resultingStatus, request.id);
  } else {
    await markAttendance({
      studentId: request.studentId,
      studentName: request.studentName,
      teacherId: request.teacherId,
      lessonId: request.lessonId,
      lessonTitle: request.lessonTitle,
      date: request.date,
      status: resultingStatus,
      fromPermissionRequestId: request.id,
    });
  }

  await createNotification({
    userId: request.studentId,
    type: decision === "approved" ? "permission_approved" : "permission_denied",
    title: decision === "approved" ? "Permission approved" : "Permission denied",
    message:
      decision === "approved"
        ? `Your request for "${request.lessonTitle}" on ${request.date} was approved.`
        : `Your request for "${request.lessonTitle}" on ${request.date} was denied.`,
    relatedId: request.id,
  });
}

/* Marks                                                               */

export async function addMark(mark: Omit<Mark, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, "marks"), { ...mark, createdAt: nowIso() });
  await createNotification({
    userId: mark.studentId,
    type: "new_mark",
    title: "New mark added",
    message: `${mark.subject}: ${mark.title} ; ${mark.score}/${mark.maxScore}`,
    relatedId: ref.id,
  });
  return ref.id;
}

export async function deleteMark(id: string) {
  await deleteDoc(doc(db, "marks", id));
}

export async function getMarksForStudent(studentId: string): Promise<Mark[]> {
  const q = query(
    collection(db, "marks"),
    where("studentId", "==", studentId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Mark));
}

export async function getMarksGivenByTeacher(teacherId: string): Promise<Mark[]> {
  const q = query(
    collection(db, "marks"),
    where("teacherId", "==", teacherId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Mark));
}

/* Notifications                                                       */

export async function createNotification(n: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
}) {
  await addDoc(collection(db, "notifications"), {
    ...n,
    read: false,
    createdAt: nowIso(),
  });
}

export async function getNotificationsForUser(userId: string): Promise<AppNotification[]> {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
}

export async function markNotificationRead(id: string) {
  await updateDoc(doc(db, "notifications", id), { read: true });
}
