<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const auth = useAuthStore();

const form = reactive({
  email: "email@email.com",
  password: "senha1234",
});

const submitError = ref(null);
const showPassword = ref(false);

async function onSubmit() {
  submitError.value = null;
  try {
    await auth.login({ email: form.email, password: form.password });
    await router.push("/");
  } catch (err) {
    submitError.value = auth.error || err?.message || "Falha ao autenticar.";
  }
}
</script>

<template>
  <div class="row justify-content-center">
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card shadow-sm">
        <div class="card-body">
          <h1 class="h5 mb-3">Login</h1>

          <div v-if="submitError" class="alert alert-danger py-2">
            {{ submitError }}
          </div>

          <form @submit.prevent="onSubmit">
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input v-model="form.email" class="form-control" type="email" autocomplete="email" required />
            </div>

            <div class="mb-3">
              <label class="form-label">Senha</label>
              <div class="input-group">
                <input
                  v-model="form.password"
                  class="form-control"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  required
                />
                <button
                  class="btn btn-outline-secondary"
                  type="button"
                  @click="showPassword = !showPassword"
                  :aria-pressed="showPassword"
                  :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                >
                  <i
                    :class="showPassword ? 'fi fi-rr-eye-crossed' : 'fi fi-rr-eye'"
                  ></i>
                </button>
              </div>
            </div>

            <button class="btn btn-primary w-100" type="submit" :disabled="auth.loading">
              {{ auth.loading ? "Entrando..." : "Entrar" }}
            </button>
          </form>
        </div>
      </div>

      <p class="text-muted small mt-3 mb-0 text-center">
        Usuário padrão: (admin@email.com / adminTeste1234)
        <br/>
        Seed de usuário no backend.
      </p>
    </div>
  </div>
</template>
