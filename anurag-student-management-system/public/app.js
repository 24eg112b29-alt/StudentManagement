const API = "/api/students";
const $ = (id) => document.getElementById(id);
let students = [];
let editingId = null;
let toastTimer;

const form = $("studentForm");
const modal = $("studentModal");

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase() || "ST";
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}
async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  let payload = {};
  try { payload = await response.json(); } catch (_) {}
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}
async function loadStudents() {
  $("studentTableBody").innerHTML = '<tr><td colspan="6" class="empty-state">Loading student records…</td></tr>';
  try {
    const query = $("searchInput").value.trim();
    students = await apiRequest(`${API}?q=${encodeURIComponent(query)}`);
    renderStudents();
  } catch (error) {
    $("studentTableBody").innerHTML = `<tr><td colspan="6" class="empty-state">${escapeHtml(error.message)} — make sure the backend server is running.</td></tr>`;
    showToast("Could not load student records");
  }
}
function renderStudents() {
  const status = $("statusFilter").value;
  const filtered = students.filter(s => status === "All" || s.status === status);
  $("totalCount").textContent = students.length;
  $("activeCount").textContent = students.filter(s => s.status === "Active").length;
  $("inactiveCount").textContent = students.filter(s => s.status === "Inactive").length;
  $("departmentCount").textContent = new Set(students.map(s => s.department)).size;
  $("recordCount").textContent = `${filtered.length} record${filtered.length === 1 ? "" : "s"}`;
  $("showingLabel").textContent = filtered.length ? `Showing ${filtered.length} student${filtered.length === 1 ? "" : "s"}` : "No student records to show";

  if (!filtered.length) {
    $("studentTableBody").innerHTML = `<tr><td colspan="6" class="empty-state">${students.length ? "No records match your filters." : "No students yet. Add a student to get started."}</td></tr>`;
    return;
  }
  $("studentTableBody").innerHTML = filtered.map(s => `
    <tr>
      <td><div class="student-cell"><div class="student-avatar">${escapeHtml(initials(s.name))}</div><div><div class="student-name">${escapeHtml(s.name)}</div><div class="student-email">${escapeHtml(s.email)}</div></div></div></td>
      <td class="id-cell">${escapeHtml(s.id)}</td>
      <td>${escapeHtml(s.department)}</td>
      <td>${escapeHtml(s.year)}</td>
      <td><span class="status-pill ${s.status === "Active" ? "status-active" : "status-inactive"}">${escapeHtml(s.status)}</span></td>
      <td><div class="row-actions"><button class="action-btn" title="Edit student" aria-label="Edit ${escapeHtml(s.name)}" data-action="edit" data-id="${escapeHtml(s.id)}">✎</button><button class="action-btn delete" title="Delete student" aria-label="Delete ${escapeHtml(s.name)}" data-action="delete" data-id="${escapeHtml(s.id)}">⌫</button></div></td>
    </tr>`).join("");
}
function openModal(student = null) {
  editingId = student ? student.id : null;
  form.reset();
  $("formError").textContent = "";
  $("modalTitle").textContent = student ? "Edit student" : "Add student";
  $("saveBtn").textContent = student ? "Save changes" : "Save student";
  $("studentId").disabled = !!student;
  if (student) {
    $("studentId").value = student.id;
    $("studentName").value = student.name || "";
    $("studentEmail").value = student.email || "";
    $("studentPhone").value = student.phone || "";
    $("studentDepartment").value = student.department || "";
    if (!$("studentDepartment").value && student.department) $("studentDepartment").value = "Other";
    $("studentYear").value = student.year || "";
    $("studentStatus").value = student.status || "Active";
  } else {
    $("studentStatus").value = "Active";
  }
  modal.classList.remove("hidden");
  setTimeout(() => $("studentName").focus(), 50);
}
function closeModal() {
  modal.classList.add("hidden");
  editingId = null;
  $("studentId").disabled = false;
}
function formPayload() {
  return Object.fromEntries(new FormData(form).entries());
}
async function saveStudent(event) {
  event.preventDefault();
  $("formError").textContent = "";
  const payload = formPayload();
  try {
    await apiRequest(editingId ? `${API}/${encodeURIComponent(editingId)}` : API, {
      method: editingId ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    closeModal();
    await loadStudents();
    showToast(editingId ? "Student updated successfully" : "Student added successfully");
  } catch (error) {
    $("formError").textContent = error.message;
  }
}
async function deleteStudent(id) {
  const student = students.find(s => s.id === id);
  if (!student || !window.confirm(`Delete ${student.name} (${student.id})? This cannot be undone.`)) return;
  try {
    await apiRequest(`${API}/${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadStudents();
    showToast("Student deleted");
  } catch (error) {
    showToast(error.message);
  }
}

$("addStudentBtn").addEventListener("click", () => openModal());
$("closeModalBtn").addEventListener("click", closeModal);
$("cancelBtn").addEventListener("click", closeModal);
modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });
form.addEventListener("submit", saveStudent);
$("refreshBtn").addEventListener("click", loadStudents);
$("statusFilter").addEventListener("change", renderStudents);
let searchTimer;
$("searchInput").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadStudents, 180);
});
$("studentTableBody").addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  const student = students.find(s => s.id === id);
  if (action === "edit" && student) openModal(student);
  if (action === "delete") deleteStudent(id);
});
$("todayLabel").textContent = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date());
loadStudents();
