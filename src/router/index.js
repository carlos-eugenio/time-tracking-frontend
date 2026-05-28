import { createRouter as _createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";
import EmployeesView from "../views/EmployeesView.vue";
import TimeEntriesView from "../views/TimeEntriesView.vue";
import TimeEntryReportView from "../views/TimeEntryReportView.vue";

export function createRouter() {
  const router = _createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: "/login",
        name: "login",
        component: LoginView
      },
      {
        path: "/",
        name: "home",
        component: HomeView,
        meta: { requiresAuth: true }
      },
      {
        path: "/employees",
        name: "employees",
        component: EmployeesView,
        meta: { requiresAuth: true },
      },
      {
        path: "/time-entries",
        name: "time-entries",
        component: TimeEntriesView,
        meta: { requiresAuth: true },
      },
      {
        path: "/reports/time-entries",
        name: "reports.time-entries",
        component: TimeEntryReportView,
        meta: { requiresAuth: true },
      },
    ],
  });

  router.beforeEach((to) => {
    const auth = useAuthStore();

    if (to.path === "/login" && auth.isAuthenticated) {
      return { path: "/" };
    }

    if (to.meta?.requiresAuth && !auth.isAuthenticated) {
      return { path: "/login" };
    }

    return true;
  });

  return router;
}

