import { http } from "./http";

export async function listEmployees({ page = 1, perPage = 15 } = {}) {
  const res = await http.get("employees", {
    params: { page, per_page: perPage },
  });
  return res.data;
}

export async function createEmployee(payload) {
  const res = await http.post("employees", payload);
  return res.data;
}

export async function updateEmployee(id, payload) {
  const res = await http.put(`employees/${id}`, payload);
  return res.data;
}

export async function deleteEmployee(id) {
  await http.delete(`employees/${id}`);
  return true;
}

export async function activateEmployee(id) {
  const res = await http.patch(`employees/${id}/activate`);
  return res.data;
}

export async function deactivateEmployee(id) {
  const res = await http.patch(`employees/${id}/deactivate`);
  return res.data;
}

