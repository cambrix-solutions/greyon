import { engineAPI } from "@/helpers/api";
import type { EngineAdmin, EngineDeveloper } from "@/services/engine/mappers";

export async function adminLogin(
  email: string,
  password: string,
  remember = true
) {
  return engineAPI.post<{ admin: EngineAdmin }>("/admin/login", {
    email,
    password,
    remember
  });
}

export async function adminMe() {
  return engineAPI.get<{ admin: EngineAdmin }>("/admin/me");
}

export async function adminLogout() {
  return engineAPI.post<{ message: string }>("/admin/logout");
}

export async function developerLogin(
  email: string,
  password: string,
  remember = true
) {
  return engineAPI.post<{ developer: EngineDeveloper }>("/developer/login", {
    email,
    password,
    remember
  });
}

export async function developerMe() {
  return engineAPI.get<{ developer: EngineDeveloper }>("/developer/me");
}

export async function developerLogout() {
  return engineAPI.post<{ message: string }>("/developer/logout");
}
