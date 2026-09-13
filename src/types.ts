export type DepartmentId =
  | 'hovc'
  | 'hovs'
  | 'putaway'
  | 'vas'
  | 'obwf'
  | 'vna'
  | 'obwi'
  | 'unassigned';

export type MachineType = 'LL' | 'RTR' | 'NONE';

export type OperatorStatus = 'active' | 'break' | 'absence';

export interface Department {
  id: DepartmentId;
  name: string;
  fullName: string;
  code: string;
  description: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  iconName: string;
  targetCount: number;
}

export interface Operator {
  id: string;
  name: string;
  machineType: MachineType; // jen LL nebo RTR
  departmentId: DepartmentId;
  isVnaOnly?: boolean; // Volitelný příznak (odemčeno pro volný přesun)
  status: OperatorStatus;
  notes?: string;
  lastMovedAt: string; // ISO string
}

export interface MoveHistoryRecord {
  id: string;
  operatorId: string;
  operatorName: string;
  machineType: MachineType;
  fromDept: DepartmentId;
  toDept: DepartmentId;
  timestamp: string;
  reason?: string;
}

export interface UndoOperation {
  id: string;
  operatorId: string;
  operatorName: string;
  machineType: MachineType;
  fromDept: DepartmentId;
  toDept: DepartmentId;
  fromStatus?: OperatorStatus;
  toStatus?: OperatorStatus;
  timestamp: string;
}

export interface ShiftTemplateAssignment {
  operatorId: string;
  operatorName: string;
  departmentId: DepartmentId;
  status: OperatorStatus;
  machineType: MachineType;
  notes?: string;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  isBuiltIn?: boolean;
  operatorCount: number;
  activeCount: number;
  assignments: ShiftTemplateAssignment[];
}

