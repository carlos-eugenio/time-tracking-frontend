<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { listEmployees } from "../services/employees";
import { createTimeEntry, deleteTimeEntry, listTimeEntries, updateTimeEntry } from "../services/timeEntries";

const loading = ref(false);
const error = ref(null);
const entries = ref([]);

const pagination = reactive({
  page: 1,
  perPage: 15,
  lastPage: 1,
  total: 0,
});

const filters = reactive({
  employeeId: "",
});

const employees = ref([]);
const employeesLoading = ref(false);
const employeesMap = computed(() => {
  const map = new Map();
  for (const e of employees.value) map.set(e.id, e);
  return map;
});

const showModal = ref(false);
const modalMode = ref("create"); // create | edit
const saving = ref(false);
const formError = ref(null);
const formErrors = ref({});

const form = reactive({
  id: null,
  employee_id: "",
  started_at: "",
  ended_at: "",
  notes: "",
});

const modalTitle = computed(() => (modalMode.value === "create" ? "Novo lançamento" : "Editar lançamento"));

function asFieldErrors(err) {
  const errors = err?.response?.data?.errors;
  if (!errors || typeof errors !== "object") return {};
  return errors;
}

function asMessage(err, fallback) {
  return err?.response?.data?.message || err?.message || fallback;
}

function resetForm() {
  form.id = null;
  form.employee_id = "";
  form.started_at = "";
  form.ended_at = "";
  form.notes = "";
  formError.value = null;
  formErrors.value = {};
}

function openCreate() {
  modalMode.value = "create";
  resetForm();
  if (filters.employeeId) form.employee_id = String(filters.employeeId);
  showModal.value = true;
}

function toDatetimeLocal(iso) {
  if (!iso) return "";
  // Backend retorna ISO (UTC). Como o campo no domínio é "local/naive",
  // mantemos o horário "de relógio" e só adaptamos para o formato do input.
  const s = String(iso);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (!m) return "";
  return `${m[1]}T${m[2]}`;
}

function fromDatetimeLocal(value) {
  if (!value) return null;
  // "YYYY-MM-DDTHH:MM" -> "YYYY-MM-DD HH:MM:00"
  const [date, time] = String(value).split("T");
  if (!date || !time) return null;
  return `${date} ${time}:00`;
}

function formatDateTime(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(d);
  } catch {
    return iso;
  }
}

function openEdit(entry) {
  modalMode.value = "edit";
  resetForm();
  form.id = entry.id;
  form.employee_id = String(entry.employee_id ?? "");
  form.started_at = toDatetimeLocal(entry.started_at);
  form.ended_at = toDatetimeLocal(entry.ended_at);
  form.notes = entry.notes ?? "";
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function loadEmployees() {
  employeesLoading.value = true;
  try {
    const res = await listEmployees({ page: 1, perPage: 1000 });
    employees.value = (res?.data ?? []).filter((e) => e.is_active);
  } catch {
    employees.value = [];
  } finally {
    employeesLoading.value = false;
  }
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const res = await listTimeEntries({
      page: pagination.page,
      perPage: pagination.perPage,
      employeeId: filters.employeeId || null,
    });
    entries.value = res?.data ?? [];

    const meta = res?.meta ?? {};
    pagination.page = meta.current_page ?? pagination.page;
    pagination.lastPage = meta.last_page ?? pagination.lastPage;
    pagination.total = meta.total ?? pagination.total;
    pagination.perPage = meta.per_page ?? pagination.perPage;
  } catch (err) {
    error.value = asMessage(err, "Erro ao carregar pontos.");
  } finally {
    loading.value = false;
  }
}

async function onSave() {
  saving.value = true;
  formError.value = null;
  formErrors.value = {};

  const payload = {
    employee_id: Number(form.employee_id),
    started_at: fromDatetimeLocal(form.started_at),
    ended_at: fromDatetimeLocal(form.ended_at),
    notes: form.notes || null,
  };

  try {
    if (!payload.employee_id) {
      formErrors.value = { employee_id: ["Selecione um colaborador."] };
      return;
    }
    if (!payload.started_at) {
      formErrors.value = { started_at: ["Informe a data/hora de entrada."] };
      return;
    }

    if (modalMode.value === "create") {
      await createTimeEntry(payload);
      pagination.page = 1;
      await load();
      closeModal();
      return;
    }

    await updateTimeEntry(form.id, payload);
    await load();
    closeModal();
  } catch (err) {
    formErrors.value = asFieldErrors(err);
    formError.value = asMessage(err, "Erro ao salvar lançamento.");
  } finally {
    saving.value = false;
  }
}

async function onDelete(entry) {
  const employeeName = employeesMap.value.get(entry.employee_id)?.name || `#${entry.employee_id}`;
  const ok = window.confirm(`Excluir o lançamento de ${employeeName} em ${formatDateTime(entry.started_at)}?`);
  if (!ok) return;

  try {
    await deleteTimeEntry(entry.id);
    await load();
    if (entries.value.length === 0 && pagination.page > 1) {
      pagination.page -= 1;
      await load();
    }
  } catch (err) {
    error.value = asMessage(err, "Erro ao excluir lançamento.");
  }
}

function goTo(page) {
  if (page < 1 || page > pagination.lastPage) return;
  pagination.page = page;
  load();
}

function onPerPageChange() {
  pagination.page = 1;
  load();
}

function onFilterChange() {
  pagination.page = 1;
  load();
}

onMounted(async () => {
  await loadEmployees();
  await load();
});
</script>

<template>
  <div class="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
    <h1 class="h5 mb-0">Pontos</h1>
    <div class="d-flex flex-wrap gap-2 align-items-center">
      <div class="d-flex align-items-center gap-2">
        <label class="text-muted small mb-0" for="employeeFilter">Colaborador</label>
        <select
          id="employeeFilter"
          class="form-select form-select-sm"
          style="min-width: 220px"
          v-model="filters.employeeId"
          @change="onFilterChange"
          :disabled="employeesLoading"
        >
          <option value="">Todos</option>
          <option v-for="e in employees" :key="e.id" :value="String(e.id)">{{ e.name }}</option>
        </select>
      </div>

      <div class="d-flex align-items-center gap-2">
        <label class="text-muted small mb-0" for="perPage">Por página</label>
        <select
          id="perPage"
          class="form-select form-select-sm"
          style="width: 96px"
          v-model.number="pagination.perPage"
          @change="onPerPageChange"
        >
          <option :value="10">10</option>
          <option :value="15">15</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>
      </div>

      <button class="btn btn-primary btn-sm" @click="openCreate">Novo</button>
      <button class="btn btn-outline-secondary btn-sm" @click="load" :disabled="loading">Atualizar</button>
    </div>
  </div>

  <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
  <div v-else-if="loading" class="text-muted">Carregando...</div>

  <div v-else class="bg-white border rounded-3">
    <div class="table-responsive">
      <table class="table table-striped align-middle mb-0">
        <thead>
          <tr>
            <th>Colaborador</th>
            <th>Entrada</th>
            <th>Saída</th>
            <th>Matrícula</th>
            <th>Observações</th>
            <th class="text-end" style="width: 160px">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in entries" :key="t.id">
            <td>
              <div class="fw-semibold">{{ employeesMap.get(t.employee_id)?.name || `#${t.employee_id}` }}</div>
              <div class="text-muted small">· {{ employeesMap.get(t.employee_id)?.registration_number || "-" }}</div>
            </td>
            <td>{{ formatDateTime(t.started_at) }}</td>
            <td>{{ t.ended_at ? formatDateTime(t.ended_at) : "-" }}</td>
            <td>{{ employeesMap.get(t.employee_id)?.registration_number || "-" }}</td>
            <td class="text-muted">{{ t.notes || "-" }}</td>
            <td class="text-end">
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary" @click="openEdit(t)">Editar</button>
                <button class="btn btn-outline-danger" @click="onDelete(t)">Excluir</button>
              </div>
            </td>
          </tr>
          <tr v-if="entries.length === 0">
            <td colspan="5" class="text-muted">Nenhum lançamento encontrado.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center px-3 py-2 border-top">
      <div class="text-muted small">
        Página {{ pagination.page }} de {{ pagination.lastPage }} · Total: {{ pagination.total }}
      </div>
      <div class="btn-group btn-group-sm">
        <button class="btn btn-outline-secondary" :disabled="pagination.page <= 1" @click="goTo(1)">«</button>
        <button class="btn btn-outline-secondary" :disabled="pagination.page <= 1" @click="goTo(pagination.page - 1)">‹</button>
        <button
          class="btn btn-outline-secondary"
          :disabled="pagination.page >= pagination.lastPage"
          @click="goTo(pagination.page + 1)"
        >
          ›
        </button>
        <button
          class="btn btn-outline-secondary"
          :disabled="pagination.page >= pagination.lastPage"
          @click="goTo(pagination.lastPage)"
        >
          »
        </button>
      </div>
    </div>
  </div>

  <div v-if="showModal">
    <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" @click.self="closeModal">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <form class="modal-content" @submit.prevent="onSave">
          <div class="modal-header">
            <h2 class="modal-title h6 mb-0">{{ modalTitle }}</h2>
            <button type="button" class="btn-close" aria-label="Close" @click="closeModal" :disabled="saving" />
          </div>
          <div class="modal-body">
            <div v-if="formError" class="alert alert-danger py-2">{{ formError }}</div>

            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label">Colaborador *</label>
                <select
                  v-model="form.employee_id"
                  class="form-select"
                  :class="formErrors.employee_id ? 'is-invalid' : ''"
                  required
                >
                  <option value="" disabled>Selecione</option>
                  <option v-for="e in employees" :key="e.id" :value="String(e.id)">{{ e.name }}</option>
                </select>
                <div v-if="formErrors.employee_id" class="invalid-feedback">{{ formErrors.employee_id?.[0] }}</div>
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Entrada *</label>
                <input
                  v-model="form.started_at"
                  class="form-control"
                  :class="formErrors.started_at ? 'is-invalid' : ''"
                  type="datetime-local"
                  required
                />
                <div v-if="formErrors.started_at" class="invalid-feedback">{{ formErrors.started_at?.[0] }}</div>
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Saída</label>
                <input
                  v-model="form.ended_at"
                  class="form-control"
                  :class="formErrors.ended_at ? 'is-invalid' : ''"
                  type="datetime-local"
                />
                <div v-if="formErrors.ended_at" class="invalid-feedback">{{ formErrors.ended_at?.[0] }}</div>
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Observações</label>
                <input v-model.trim="form.notes" class="form-control" :class="formErrors.notes ? 'is-invalid' : ''" />
                <div v-if="formErrors.notes" class="invalid-feedback">{{ formErrors.notes?.[0] }}</div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" type="button" @click="closeModal" :disabled="saving">Cancelar</button>
            <button class="btn btn-primary" type="submit" :disabled="saving">
              {{ saving ? "Salvando..." : "Salvar" }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <div class="modal-backdrop fade show" />
  </div>
</template>
