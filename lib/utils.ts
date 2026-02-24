import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { UserRole } from "@/enums/roles"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const wait  = (ms:number)=>{
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getUserRole(roles?: string[]): "admin" | "subadmin" | "accountant" | "secretory" {
  if (!roles) return "admin";
  if (roles.includes(UserRole.VMDDP_ADMIN)) return "admin";
  if (roles.includes(UserRole.VMDDP_SUB_ADMIN)) return "subadmin";
  if (roles.includes(UserRole.VMDDP_ACCOUNTANT)) return "accountant";
  if (roles.includes(UserRole.VMDDP_SECRETORY)) return "secretory";
  return "admin";
}