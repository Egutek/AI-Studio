import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from './firebase';
import { Operator, MoveHistoryRecord, ShiftTemplate, Department } from '../types';

const OPERATORS_COLLECTION = 'operators';
const HISTORY_COLLECTION = 'history';
const TEMPLATES_COLLECTION = 'templates';
const CUSTOM_DEPTS_COLLECTION = 'customDepartments';

// Real-time listener for Operators
export function subscribeToOperators(
  onUpdate: (operators: Operator[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, OPERATORS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Operator[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: data.id || docSnap.id,
          name: data.name || '',
          machineType: data.machineType || 'NONE',
          departmentId: data.departmentId || 'unassigned',
          isVnaOnly: Boolean(data.isVnaOnly),
          status: data.status || 'active',
          shift: data.shift || 'A',
          absenceReason: data.absenceReason || (data.departmentId === 'unassigned' ? 'Absence' : undefined),
          notes: data.notes || undefined,
          lastMovedAt: data.lastMovedAt || new Date().toISOString(),
        });
      });
      onUpdate(items);
    },
    (error) => {
      console.warn('Failed to listen to operators from Firestore:', error);
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.GET, OPERATORS_COLLECTION);
      } catch {
        // Formatted error already logged
      }
    }
  );
}

// Save or update a single operator
export async function syncOperatorToCloud(operator: Operator): Promise<void> {
  const path = `${OPERATORS_COLLECTION}/${operator.id}`;
  try {
    const docRef = doc(db, OPERATORS_COLLECTION, operator.id);
    const payload: Record<string, any> = {
      id: operator.id,
      name: operator.name.slice(0, 100),
      machineType: operator.machineType,
      departmentId: operator.departmentId,
      status: operator.status,
      shift: operator.shift || 'A',
      lastMovedAt: operator.lastMovedAt || new Date().toISOString(),
    };
    if (operator.absenceReason) {
      payload.absenceReason = operator.absenceReason;
    }
    if (operator.isVnaOnly !== undefined) {
      payload.isVnaOnly = Boolean(operator.isVnaOnly);
    }
    if (operator.notes) {
      payload.notes = operator.notes.slice(0, 500);
    }
    if (auth.currentUser?.uid) {
      payload.updatedBy = auth.currentUser.uid.slice(0, 128);
    }

    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Delete an operator from Firestore
export async function deleteOperatorFromCloud(operatorId: string): Promise<void> {
  const path = `${OPERATORS_COLLECTION}/${operatorId}`;
  try {
    const docRef = doc(db, OPERATORS_COLLECTION, operatorId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Bulk sync or seed operators to Firestore
export async function bulkSyncOperatorsToCloud(operators: Operator[]): Promise<void> {
  try {
    // Firestore batch limit is 500 operations
    const chunks: Operator[][] = [];
    for (let i = 0; i < operators.length; i += 400) {
      chunks.push(operators.slice(i, i + 400));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const op of chunk) {
        const docRef = doc(db, OPERATORS_COLLECTION, op.id);
        const payload: Record<string, any> = {
          id: op.id,
          name: op.name.slice(0, 100),
          machineType: op.machineType,
          departmentId: op.departmentId,
          status: op.status,
          shift: op.shift || 'A',
          lastMovedAt: op.lastMovedAt || new Date().toISOString(),
        };
        if (op.absenceReason) {
          payload.absenceReason = op.absenceReason;
        }
        if (op.isVnaOnly !== undefined) {
          payload.isVnaOnly = Boolean(op.isVnaOnly);
        }
        if (op.notes) {
          payload.notes = op.notes.slice(0, 500);
        }
        if (auth.currentUser?.uid) {
          payload.updatedBy = auth.currentUser.uid.slice(0, 128);
        }
        batch.set(docRef, payload, { merge: true });
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, OPERATORS_COLLECTION);
  }
}

// Real-time listener for Move History
export function subscribeToHistory(
  onUpdate: (history: MoveHistoryRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, HISTORY_COLLECTION),
    orderBy('timestamp', 'desc'),
    limit(100)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const records: MoveHistoryRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        records.push({
          id: data.id || docSnap.id,
          operatorId: data.operatorId,
          operatorName: data.operatorName,
          machineType: data.machineType,
          fromDept: data.fromDept,
          toDept: data.toDept,
          timestamp: data.timestamp,
          reason: data.reason || undefined,
        });
      });
      onUpdate(records);
    },
    (error) => {
      console.warn('Failed to listen to history from Firestore:', error);
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.GET, HISTORY_COLLECTION);
      } catch {
        // Formatted error already logged
      }
    }
  );
}

// Save a move history record
export async function syncHistoryRecordToCloud(record: MoveHistoryRecord): Promise<void> {
  const path = `${HISTORY_COLLECTION}/${record.id}`;
  try {
    const docRef = doc(db, HISTORY_COLLECTION, record.id);
    const payload: Record<string, any> = {
      id: record.id,
      operatorId: record.operatorId.slice(0, 128),
      operatorName: record.operatorName.slice(0, 100),
      machineType: record.machineType.slice(0, 20),
      fromDept: record.fromDept.slice(0, 30),
      toDept: record.toDept.slice(0, 30),
      timestamp: record.timestamp,
    };
    if (record.shift) {
      payload.shift = record.shift;
    }
    if (record.reason) {
      payload.reason = record.reason.slice(0, 300);
    }
    if (auth.currentUser?.uid) {
      payload.userId = auth.currentUser.uid.slice(0, 128);
    }
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Real-time listener for Shift Templates
export function subscribeToTemplates(
  onUpdate: (templates: ShiftTemplate[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, TEMPLATES_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const templates: ShiftTemplate[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        templates.push({
          id: data.id || docSnap.id,
          name: data.name,
          description: data.description || undefined,
          createdAt: data.createdAt,
          isBuiltIn: Boolean(data.isBuiltIn),
          shift: data.shift || 'A',
          operatorCount: Number(data.operatorCount || 0),
          activeCount: Number(data.activeCount || 0),
          assignments: Array.isArray(data.assignments) ? data.assignments : [],
        });
      });
      onUpdate(templates);
    },
    (error) => {
      console.warn('Failed to listen to shift templates from Firestore:', error);
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.GET, TEMPLATES_COLLECTION);
      } catch {
        // Formatted error already logged
      }
    }
  );
}

// Save a shift template
export async function syncTemplateToCloud(template: ShiftTemplate): Promise<void> {
  const path = `${TEMPLATES_COLLECTION}/${template.id}`;
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, template.id);
    const payload: Record<string, any> = {
      id: template.id,
      name: template.name.slice(0, 120),
      createdAt: template.createdAt,
      operatorCount: template.operatorCount,
      activeCount: template.activeCount,
      isBuiltIn: Boolean(template.isBuiltIn),
      shift: template.shift || 'A',
      assignments: template.assignments,
    };
    if (template.description) {
      payload.description = template.description.slice(0, 500);
    }
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Delete a custom shift template
export async function deleteTemplateFromCloud(templateId: string): Promise<void> {
  const path = `${TEMPLATES_COLLECTION}/${templateId}`;
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Real-time listener for Custom / Ad-hoc Departments (Vícepráce)
export function subscribeToCustomDepartments(
  onUpdate: (depts: Department[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, CUSTOM_DEPTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const depts: Department[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.id && data.name) {
          depts.push({
            id: data.id,
            name: data.name,
            fullName: data.fullName || `Vícepráce: ${data.name}`,
            code: data.code || 'VÍCE',
            description: data.description || '',
            color: data.color || 'amber',
            badgeBg:
              data.badgeBg ||
              'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
            badgeText: data.badgeText || 'text-amber-700 dark:text-amber-400',
            borderColor: data.borderColor || 'border-amber-400 dark:border-amber-600',
            iconName: data.iconName || 'Wrench',
            targetCount: typeof data.targetCount === 'number' ? data.targetCount : 0,
            isCustom: true,
            shift: data.shift || 'A',
            createdAt: data.createdAt || new Date().toISOString(),
          });
        }
      });
      // Sort newest first or by creation
      depts.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onUpdate(depts);
    },
    (err) => {
      console.warn('Failed to listen to custom departments from Firestore:', err);
      if (onError) onError(err);
      try {
        handleFirestoreError(err, OperationType.LIST, CUSTOM_DEPTS_COLLECTION);
      } catch {
        // Formatted error already logged
      }
    }
  );
}

// Save a custom department to Firestore
export async function syncCustomDepartmentToCloud(dept: Department): Promise<void> {
  const path = `${CUSTOM_DEPTS_COLLECTION}/${dept.id}`;
  try {
    const docRef = doc(db, CUSTOM_DEPTS_COLLECTION, dept.id);
    const payload: Record<string, any> = {
      id: dept.id,
      name: dept.name.slice(0, 100),
      fullName: (dept.fullName || `Vícepráce: ${dept.name}`).slice(0, 120),
      code: (dept.code || 'VÍCE').slice(0, 20),
      description: (dept.description || '').slice(0, 500),
      color: dept.color || 'amber',
      badgeBg: dept.badgeBg,
      badgeText: dept.badgeText,
      borderColor: dept.borderColor,
      iconName: dept.iconName || 'Wrench',
      targetCount: dept.targetCount || 0,
      isCustom: true,
      shift: dept.shift || 'A',
      createdAt: dept.createdAt || new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Delete a custom department from Firestore
export async function deleteCustomDepartmentFromCloud(deptId: string): Promise<void> {
  const path = `${CUSTOM_DEPTS_COLLECTION}/${deptId}`;
  try {
    const docRef = doc(db, CUSTOM_DEPTS_COLLECTION, deptId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

