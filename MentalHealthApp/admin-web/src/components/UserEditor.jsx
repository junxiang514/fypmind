import React from 'react';

export default function UserEditor({ userForm, setUserForm, saving, selectedUserId, onSave, onDelete, isEditingUser, onCloseEditor }) {
  if (!isEditingUser || !userForm) return null;

  return (
    <div className="modal-overlay" onClick={onCloseEditor}>
      <div className="modal-content modal-editor" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit User Profile</h2>
          <button className="modal-close" onClick={onCloseEditor}>✕</button>
        </div>
        <div className="modal-body">
      <label>Full name</label>
      <input value={userForm.full_name} onChange={(e) => setUserForm((s) => ({ ...s, full_name: e.target.value }))} />
      <label>Email</label>
      <input value={userForm.email} onChange={(e) => setUserForm((s) => ({ ...s, email: e.target.value }))} />
      <label>Phone</label>
      <input value={userForm.phone} onChange={(e) => setUserForm((s) => ({ ...s, phone: e.target.value }))} />
      <label>Gender</label>
      <input value={userForm.gender} onChange={(e) => setUserForm((s) => ({ ...s, gender: e.target.value }))} />
      <label>Role</label>
      <select value={userForm.role} onChange={(e) => setUserForm((s) => ({ ...s, role: e.target.value }))}>
        <option value="user">user</option>
        <option value="admin">admin</option>
      </select>
      <label>Medical history</label>
      <textarea value={userForm.medical_history} onChange={(e) => setUserForm((s) => ({ ...s, medical_history: e.target.value }))} />
      <div className="checks">
        <label><input type="checkbox" checked={userForm.is_admin} onChange={(e) => setUserForm((s) => ({ ...s, is_admin: e.target.checked }))} /> is_admin</label>
        <label><input type="checkbox" checked={userForm.is_active} onChange={(e) => setUserForm((s) => ({ ...s, is_active: e.target.checked }))} /> is_active</label>
      </div>
        </div>
        <div className="modal-footer">
          <button className="btn light" onClick={onCloseEditor}>Cancel</button>
          <button className="btn primary" onClick={onSave} disabled={saving}>Save</button>
          {selectedUserId && <button className="btn danger" onClick={onDelete} disabled={saving}>Delete Profile Row</button>}
        </div>
      </div>
    </div>
  );
}
