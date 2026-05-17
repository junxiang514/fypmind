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
      <div className="admin-toggle-row">
        <div className="admin-toggle-label">Admin Access</div>
        <label className="switch" aria-label="Toggle admin">
          <input
            type="checkbox"
            checked={userForm.is_admin}
            onChange={(e) =>
              setUserForm((s) => ({
                ...s,
                is_admin: e.target.checked,
                role: e.target.checked ? (s.role || 'Mental Health Consultant') : null,
              }))
            }
          />
          <span className="slider" />
        </label>
      </div>

      <div className={`role-collapsible ${userForm.is_admin ? 'open' : ''}`}>
        <label>Role</label>
        <select value={userForm.role || 'Mental Health Consultant'} onChange={(e) => setUserForm((s) => ({ ...s, role: e.target.value }))}>
          <option value="Mental Health Consultant">Mental Health Consultant</option>
          <option value="Head of Mental Health Consultant">Head of Mental Health Consultant</option>
          <option value="Application Manager">Application Manager</option>
          <option value="Head of Application Manager">Head of Application Manager</option>
        </select>
      </div>
      {/* medical_history removed */}
      <div className="checks">
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
