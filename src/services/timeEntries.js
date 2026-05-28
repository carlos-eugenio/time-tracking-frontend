import { http } from "./http";

export async function listTimeEntries({ page = 1, perPage = 15, employeeId = null } = {}) {
  const params = { page, per_page: perPage };
  if (employeeId) params.employee_id = employeeId;

  const res = await http.get("time-entries", { params });
  return res.data;
}

export async function createTimeEntry(payload) {
  const res = await http.post("time-entries", payload);
  return res.data;
}

export async function updateTimeEntry(id, payload) {
  const res = await http.put(`time-entries/${id}`, payload);
  return res.data;
}

export async function deleteTimeEntry(id) {
  await http.delete(`time-entries/${id}`);
  return true;
}

