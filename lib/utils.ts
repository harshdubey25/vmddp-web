import { clsx, type ClassValue } from "clsx"
import { resolve } from "path"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const wait  = (ms:number)=>{
  return new Promise(resolve => setTimeout(resolve, ms));
}