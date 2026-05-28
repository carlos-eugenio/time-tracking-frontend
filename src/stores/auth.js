import { defineStore } from "pinia";
import { http } from "../services/http";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("auth_token") || null,
    user: JSON.parse(localStorage.getItem("auth_user") || "null"),
    loading: false,
    error: null,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
  },
  actions: {
    async login({ email, password, deviceName = "web" }) {
      this.loading = true;
      this.error = null;
      try {
        const res = await http.post("auth/login", {
          email,
          password,
          device_name: deviceName,
        });

        const token = res?.data?.data?.token;
        const user = res?.data?.data?.user;
        if (!token) {
          throw new Error("Resposta de login inválida (token ausente).");
        }

        this.token = token;
        this.user = user ?? null;
        localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_user", JSON.stringify(this.user));
      } catch (err) {
        this.error = err?.response?.data?.message || err?.message || "Falha ao autenticar.";
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async logout() {
      this.loading = true;
      this.error = null;
      try {
        await http.post("auth/logout");
      } catch {

      } finally {
        this.token = null;
        this.user = null;
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        this.loading = false;
      }
    },
  },
});

