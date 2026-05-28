<script setup>
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
</script>

<template>
  <div class="p-4 bg-white border rounded-3">
    <h1 class="h4 mb-2">Bem-vindo</h1>
    <p class="text-muted mb-0">
      Você está logado{{ auth.user?.name ? ` como ${auth.user.name}` : "" }}.
    </p>
  </div>
</template>

