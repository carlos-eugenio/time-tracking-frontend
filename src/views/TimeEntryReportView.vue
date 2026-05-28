<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { listEmployees } from "../services/employees";
import { exportTimeEntriesReport, listTimeEntriesReport } from "../services/reports";

const loading = ref(false);
const error = ref(null);
const items = ref([]);
const meta = ref({
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
  total_minutes: 0,
  total_hours: 0,
});

const employees = ref([]);
const employeesLoading = ref(false);

const filters = reactive({
  start_date: "",
  end_date: "",
  employee_id: "",
  sort: "date",
  direction: "asc",
});

const pagination = reactive({
  page: 1,
  perPage: 15,
});

const canSearch = computed(() => Boolean(filters.start_date && filters.end_date));
const prettyTotal = computed(() => {
  const hours = Number(meta.value?.total_hours ?? 0);
  const minutes = Number(meta.value?.total_minutes ?? 0);
  return { hours, minutes };
});

function asMessage(err, fallback) {
  return err?.response?.data?.message || err?.message || fallback;
}

function ensureDefaultDates() {
  if (filters.start_date && filters.end_date) return;

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const pad = (n) => String(n).padStart(2, "0");

  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);

  filters.start_date = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
  filters.end_date = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
}

async function loadEmployees() {
  employeesLoading.value = true;
  try {
    const res = await listEmployees({ page: 1, perPage: 1000 });
    employees.value = res?.data ?? [];
  } catch {
    employees.value = [];
  } finally {
    employeesLoading.value = false;
  }
}

async function load() {
  if (!canSearch.value) {
    error.value = "Informe início e fim.";
    return;
  }

  loading.value = true;
  error.value = null;
  try {
    const res = await listTimeEntriesReport({
      startDate: filters.start_date,
      endDate: filters.end_date,
      employeeId: filters.employee_id || null,
      sort: filters.sort,
      direction: filters.direction,
      page: pagination.page,
      perPage: pagination.perPage,
    });

    items.value = res?.data ?? [];
    meta.value = res?.meta ?? meta.value;
  } catch (err) {
    error.value = asMessage(err, "Erro ao carregar relatório.");
  } finally {
    loading.value = false;
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportReport(format) {
  if (!canSearch.value) {
    error.value = "Informe início e fim para exportar.";
    return;
  }

  try {
    const { blob, filename, contentType } = await exportTimeEntriesReport({
      startDate: filters.start_date,
      endDate: filters.end_date,
      employeeId: filters.employee_id || null,
      sort: filters.sort,
      direction: filters.direction,
      format,
    });

    if (format === "pdf") {
      const url = URL.createObjectURL(new Blob([blob], { type: contentType || "application/pdf" }));
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      return;
    }

    downloadBlob(blob, filename);
  } catch (err) {
    error.value = asMessage(err, "Erro ao exportar relatório.");
  }
}

function onSearch() {
  pagination.page = 1;
  load();
}

function goTo(page) {
  const last = Number(meta.value?.last_page ?? 1);
  if (page < 1 || page > last) return;
  pagination.page = page;
  load();
}

function onPerPageChange() {
  pagination.page = 1;
  load();
}

function toggleSort(nextSort) {
  if (filters.sort === nextSort) {
    filters.direction = filters.direction === "asc" ? "desc" : "asc";
  } else {
    filters.sort = nextSort;
    filters.direction = "asc";
  }
  onSearch();
}

function formatDateTime(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" }).format(d);
  } catch {
    return String(iso);
  }
}

function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return "-";
  const mins = Number(minutes);
  if (Number.isNaN(mins)) return "-";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

const sortIndicator = computed(() => {
  const arrow = filters.direction === "asc" ? "▲" : "▼";
  return { arrow };
});

onMounted(async () => {
  ensureDefaultDates();
  await loadEmployees();
  await load();
});
</script>

<template>
  <div class="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
    <h1 class="h5 mb-0">Relatório de pontos</h1>
    <div class="d-flex gap-2">
      <button class="btn btn-outline-secondary btn-sm" @click="load" :disabled="loading">Atualizar</button>
      <div class="btn-group">
        <button class="btn btn-outline-primary btn-sm dropdown-toggle" data-bs-toggle="dropdown" :disabled="loading">
          Exportar
        </button>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><button class="dropdown-item" @click="exportReport('csv')">CSV</button></li>
          <li><button class="dropdown-item" @click="exportReport('xlsx')">XLSX</button></li>
          <li><button class="dropdown-item" @click="exportReport('pdf')">PDF</button></li>
        </ul>
      </div>
    </div>
  </div>

  <div class="bg-white border rounded-3 p-3 mb-3">
    <div class="row g-2 align-items-end">
      <div class="col-12 col-md-3">
        <label class="form-label mb-1">Início *</label>
        <input v-model="filters.start_date" type="date" class="form-control form-control-sm" />
      </div>
      <div class="col-12 col-md-3">
        <label class="form-label mb-1">Fim *</label>
        <input v-model="filters.end_date" type="date" class="form-control form-control-sm" />
      </div>
      <div class="col-12 col-md-4">
        <label class="form-label mb-1">Colaborador</label>
        <select
          class="form-select form-select-sm"
          v-model="filters.employee_id"
          :disabled="employeesLoading"
          title="Opcional"
        >
          <option value="">Todos</option>
          <option v-for="e in employees" :key="e.id" :value="String(e.id)">{{ e.name }}</option>
        </select>
      </div>
      <div class="col-12 col-md-2 d-grid">
        <button class="btn btn-primary btn-sm" @click="onSearch" :disabled="loading || !canSearch">Buscar</button>
      </div>

      <div class="col-12">
        <div class="d-flex flex-wrap gap-2 align-items-center">
          <div class="d-flex align-items-center gap-2">
            <span class="text-muted small">Ordenar por</span>
            <select v-model="filters.sort" class="form-select form-select-sm" style="width: 120px" @change="onSearch">
              <option value="date">Data</option>
              <option value="name">Nome</option>
            </select>
            <select
              v-model="filters.direction"
              class="form-select form-select-sm"
              style="width: 120px"
              @change="onSearch"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>

          <div class="ms-auto d-flex align-items-center gap-2">
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
              <option :value="100">100</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
  <div v-else-if="loading" class="text-muted">Carregando...</div>

  <div v-else class="bg-white border rounded-3">
    <div class="d-flex flex-wrap gap-3 align-items-center justify-content-between px-3 py-2 border-bottom">
      <div class="text-muted small">
        Total: <span class="fw-semibold">{{ prettyTotal.hours }}</span> h
        (<span class="fw-semibold">{{ prettyTotal.minutes }}</span> min)
      </div>
      <div class="text-muted small">
        Página {{ meta?.current_page ?? 1 }} de {{ meta?.last_page ?? 1 }} · Registros: {{ meta?.total ?? 0 }}
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-striped align-middle mb-0">
        <thead>
          <tr>
            <th style="cursor: pointer" @click="toggleSort('name')">
              Colaborador
              <span v-if="filters.sort === 'name'" class="text-muted small ms-1">{{ sortIndicator.arrow }}</span>
            </th>
            <th style="cursor: pointer" @click="toggleSort('date')">
              Entrada
              <span v-if="filters.sort === 'date'" class="text-muted small ms-1">{{ sortIndicator.arrow }}</span>
            </th>
            <th>Saída</th>
            <th class="text-end">Duração</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in items" :key="row.id">
            <td>
              <div class="fw-semibold">{{ row.employee_name || `#${row.employee_id}` }}</div>
              <div class="text-muted small">#{{ row.id }}</div>
            </td>
            <td>{{ formatDateTime(row.started_at) }}</td>
            <td>{{ row.ended_at ? formatDateTime(row.ended_at) : "-" }}</td>
            <td class="text-end">{{ formatDuration(row.duration_minutes) }}</td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="4" class="text-muted">Nenhum registro no período.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center px-3 py-2 border-top">
      <div class="text-muted small"></div>
      <div class="btn-group btn-group-sm">
        <button class="btn btn-outline-secondary" :disabled="(meta?.current_page ?? 1) <= 1" @click="goTo(1)">«</button>
        <button
          class="btn btn-outline-secondary"
          :disabled="(meta?.current_page ?? 1) <= 1"
          @click="goTo((meta?.current_page ?? 1) - 1)"
        >
          ‹
        </button>
        <button
          class="btn btn-outline-secondary"
          :disabled="(meta?.current_page ?? 1) >= (meta?.last_page ?? 1)"
          @click="goTo((meta?.current_page ?? 1) + 1)"
        >
          ›
        </button>
        <button
          class="btn btn-outline-secondary"
          :disabled="(meta?.current_page ?? 1) >= (meta?.last_page ?? 1)"
          @click="goTo(meta?.last_page ?? 1)"
        >
          »
        </button>
      </div>
    </div>
  </div>
</template>
