<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "./stores/auth";

const router = useRouter();
const auth = useAuthStore();
const isAuthed = computed(() => auth.isAuthenticated);

async function onLogout() {
  await auth.logout();
  await router.push("/login");
}
</script>

<template>
  <div class="min-vh-100 bg-light">
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark" v-if="isAuthed">
      <div class="container">
        <a class="navbar-brand" href="/">Time Tracking</a>

        <div class="collapse navbar-collapse" id="mainNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <RouterLink class="nav-link" to="/employees">Colaboradores</RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink class="nav-link" to="/time-entries">Pontos</RouterLink>
            </li>
          </ul>

          <button class="btn btn-outline-light btn-sm" @click="onLogout">
            Sair
          </button>
        </div>
      </div>
    </nav>

    <main class="container py-4">
      <RouterView />
    </main>
  </div>
</template>
