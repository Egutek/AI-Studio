# Security Specification: ZF Operativa Ostrov (Firestore Collaborative ABAC)

## 1. Data Invariants
1. **Default Deny Catch-All**: All paths without explicit permission must be rejected (`match /{document=**} { allow read, write: if false; }`).
2. **Real-Time Collaborative Shift Access**: Anyone with the app link can access the shift management board in real time, view operators, and submit operational department reassignments, updates, or additions so that all devices on the floor are synchronized immediately.
3. **Operator Schema & Data Integrity**: Every operator mutation must strictly validate via `isValidOperator`: the operator ID must be safe (`isValidId(operatorId)`), `machineType` in `['LL', 'RTR', 'NONE']`, `departmentId` in `['hovc', 'hovs', 'putaway', 'vas', 'obwf', 'vna', 'obwi', 'unassigned']`, and `status` in `['active', 'break', 'absence']`. The ID remains immutable on updates.
4. **Audit History Log Integrity**: Historical move records once created cannot be mutated or deleted by unauthorized actors (`allow update, delete: if isAdmin()`). New records must conform strictly to `isValidHistory`.
5. **Shift Template Protection**: Custom shift templates require valid structural payload (`isValidTemplate`) with bounded name and size limits. Built-in templates cannot be deleted by non-admins.
6. **PII and Admin Role Isolation**: Normal users cannot self-promote to `role: 'admin'` or modify administrative privileges in `/admins/` or `/users/`. The runtime admin email is `hemzacekl@gmail.com`.
7. **Path Variable Hardening**: All single-document IDs must be strings matching `^[a-zA-Z0-9_\-]+$` and be at most 128 characters to guard against ID poisoning attacks.
8. **String Size Bounding**: All string properties (e.g. `name`, `notes`, `reason`) have strictly bounded sizes to prevent denial of wallet attacks.

## 2. The Dirty Dozen Payloads (Designed to Fail)
1. **Root Catch-all Breach**: An attempt to write arbitrary data to `/unauthorized_collection/secret`.
2. **ID Poisoning Attack**: An operator created with an ID exceeding 128 chars or containing invalid script characters `op<script>`.
3. **Invalid Machine Type**: An operator created with machineType `'SUPER_FORKLIFT'`.
4. **Invalid Department ID**: An operator assigned to `'finance_secret_dept'`.
5. **Invalid Status Transition**: An operator status set to `'sleeping'`.
6. **Oversized String Injection**: An operator note field injected with 50KB payload (exceeding 500 characters).
7. **ID Mutation on Update**: An operator update attempt that tries to alter `id` to a different value.
8. **History Tampering**: An attempt to update an existing audit log entry in `/history/hist-1`.
9. **History Deletion**: A non-admin user attempting to delete a move history record from `/history/hist-1`.
10. **Privilege Escalation**: A user attempting to set their own profile role to `'admin'` in `/users/{userId}`.
11. **Admin Document Write**: A non-admin attempting to create a document in `/admins/{uid}`.
12. **Shadow Field Injection**: An operator write containing an extra unapproved field `__shadow_is_admin: true`.
