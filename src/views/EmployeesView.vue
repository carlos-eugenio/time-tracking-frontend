<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import {
  activateEmployee,
  createEmployee,
  deactivateEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee,
} from "../services/employees";

const loading = ref(false);
const error = ref(null);

const employees = ref([]);
const pagination = reactive({
  page: 1,
  perPage: 15,
  lastPage: 1,
  total: 0,
});

const showModal = ref(false);
const modalMode = ref("create"); // create | edit
const saving = ref(false);
const formError = ref(null);
const formErrors = ref({});

const form = reactive({
  id: null,
  name: "",
  email: "",
  document: "",
  job_title: "",
  registration_number: "",
  is_active: true,
});

const modalTitle = computed(() => (modalMode.value === "create" ? "Novo colaborador" : "Editar colaborador"));

function resetForm() {
  form.id = null;
  form.name = "";
  form.email = "";
  form.document = "";
  form.job_title = "";
  form.registration_number = "";
  form.is_active = true;
  formError.value = null;
  formErrors.value = {};
}

function openCreate() {
  modalMode.value = "create";
  resetForm();
  showModal.value = true;
}

function openEdit(employee) {
  modalMode.value = "edit";
  resetForm();
  form.id = employee.id;
  form.name = employee.name ?? "";
  form.email = employee.email ?? "";
  form.document = employee.document ?? "";
  form.job_title = employee.job_title ?? "";
  form.registration_number = employee.registration_number ?? "";
  form.is_active = Boolean(employee.is_active);
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

function asFieldErrors(err) {
  const errors = err?.response?.data?.errors;
  if (!errors || typeof errors !== "object") return {};
  return errors;
}

function asMessage(err, fallback) {
  return err?.response?.data?.message || err?.message || fallback;
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const res = await listEmployees({ page: pagination.page, perPage: pagination.perPage });
    employees.value = res?.data ?? [];

    const meta = res?.meta ?? {};
    pagination.page = meta.current_page ?? pagination.page;
    pagination.lastPage = meta.last_page ?? pagination.lastPage;
    pagination.total = meta.total ?? pagination.total;
    pagination.perPage = meta.per_page ?? pagination.perPage;
  } catch (err) {
    error.value = asMessage(err, "Erro ao carregar colaboradores.");
  } finally {
    loading.value = false;
  }
}

async function onSave() {
  saving.value = true;
  formError.value = null;
  formErrors.value = {};

  const payload = {
    name: form.name,
    email: form.email || null,
    document: form.document || null,
    job_title: form.job_title || null,
    registration_number: form.registration_number || null,
    is_active: Boolean(form.is_active),
  };

  try {
    if (modalMode.value === "create") {
      await createEmployee(payload);
      pagination.page = 1;
      await load();
      closeModal();
      return;
    }

    await updateEmployee(form.id, payload);
    await load();
    closeModal();
  } catch (err) {
    formErrors.value = asFieldErrors(err);
    formError.value = asMessage(err, "Erro ao salvar colaborador.");
  } finally {
    saving.value = false;
  }
}

async function onDelete(employee) {
  const ok = window.confirm(`Excluir o colaborador \"${employee.name}\"? Essa ação não pode ser desfeita.`);
  if (!ok) return;

  try {
    await deleteEmployee(employee.id);

    await load();
    if (employees.value.length === 0 && pagination.page > 1) {
      pagination.page -= 1;
      await load();
    }
  } catch (err) {
    error.value = asMessage(err, "Erro ao excluir colaborador.");
  }
}

async function onToggleActive(employee) {
  const nextActive = !employee.is_active;

  try {
    if (nextActive) {
      await activateEmployee(employee.id);
    } else {
      await deactivateEmployee(employee.id);
    }
    await load();
  } catch (err) {
    error.value = asMessage(err, "Erro ao atualizar status do colaborador.");
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

onMounted(load);
</script>

<template>
  <div class="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
    <h1 class="h5 mb-0">Colaboradores</h1>
    <div class="d-flex gap-2 align-items-center">
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
            <th>Nome</th>
            <th>Email</th>
            <th>Cargo</th>
            <th>Matrícula</th>
            <th class="text-end">Status</th>
            <th class="text-end" style="width: 220px">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in employees" :key="e.id">
            <td>
              <div class="fw-semibold">{{ e.name }}</div>
              <div class="text-muted small">· {{ e.document || "Sem documento" }}</div>
            </td>
            <td>{{ e.email || "-" }}</td>
            <td>{{ e.job_title || "-" }}</td>
            <td>{{ e.registration_number || "-" }}</td>
            <td class="text-end">
              <span class="badge" :class="e.is_active ? 'text-bg-success' : 'text-bg-secondary'">
                {{ e.is_active ? "Ativo" : "Inativo" }}
              </span>
            </td>
            <td class="text-end">
              <div class="btn-group btn-group-sm" role="group">
                <button class="btn btn-outline-primary" @click="openEdit(e)">Editar</button>
                <button class="btn btn-outline-secondary" @click="onToggleActive(e)">
                  {{ e.is_active ? "Inativar" : "Ativar" }}
                </button>
                <button class="btn btn-outline-danger" @click="onDelete(e)">Excluir</button>
              </div>
            </td>
          </tr>
          <tr v-if="employees.length === 0">
            <td colspan="6" class="text-muted">Nenhum colaborador encontrado.</td>
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
        <button class="btn btn-outline-secondary" :disabled="pagination.page <= 1" @click="goTo(pagination.page - 1)">
          ‹
        </button>
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
            <div v-if="formError" class="alert alert-danger py-2">
              {{ formError }}
            </div>

            <div class="row g-3">
              <div class="col-12">
                <label class="form-label">Nome *</label>
                <input
                  v-model.trim="form.name"
                  class="form-control"
                  :class="formErrors.name ? 'is-invalid' : ''"
                  placeholder="Ex: Maria Souza"
                  required
                />
                <div v-if="formErrors.name" class="invalid-feedback">{{ formErrors.name?.[0] }}</div>
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Email</label>
                <input
                  v-model.trim="form.email"
                  class="form-control"
                  :class="formErrors.email ? 'is-invalid' : ''"
                  type="email"
                  placeholder="maria.souza@example.com"
                />
                <div v-if="formErrors.email" class="invalid-feedback">{{ formErrors.email?.[0] }}</div>
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Documento</label>
                <input
                  v-model.trim="form.document"
                  class="form-control"
                  :class="formErrors.document ? 'is-invalid' : ''"
                  placeholder="CPF/CNPJ (opcional)"
                />
                <div v-if="formErrors.document" class="invalid-feedback">{{ formErrors.document?.[0] }}</div>
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Cargo</label>
                <input
                  v-model.trim="form.job_title"
                  class="form-control"
                  :class="formErrors.job_title ? 'is-invalid' : ''"
                  placeholder="Analista Administrativo"
                />
                <div v-if="formErrors.job_title" class="invalid-feedback">{{ formErrors.job_title?.[0] }}</div>
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Matrícula</label>
                <input
                  v-model.trim="form.registration_number"
                  class="form-control"
                  :class="formErrors.registration_number ? 'is-invalid' : ''"
                  placeholder="EMP-001"
                />
                <div v-if="formErrors.registration_number" class="invalid-feedback">
                  {{ formErrors.registration_number?.[0] }}
                </div>
              </div>

              <div class="col-12">
                <div class="form-check">
                  <input id="isActive" v-model="form.is_active" class="form-check-input" type="checkbox" />
                  <label class="form-check-label" for="isActive">Ativo</label>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" type="button" @click="closeModal" :disabled="saving">
              Cancelar
            </button>
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
