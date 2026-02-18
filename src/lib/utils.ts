import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getFortnightStart(date: Date = new Date()): string {
    // Data de referência: 08 de Fevereiro de 2026
    // Ajustando para o fuso horário local ou UTC conforme necessário, mas mantendo a consistência de dias.
    // Vamos usar UTC para evitar problemas de fuso horário, assumindo que a data de entrada também é tratada corretamente.
    // Mas para simplificar para o frontend que usa YYYY-MM-DD local:
    
    const refDate = new Date("2026-02-08T00:00:00");
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // Diferença em milissegundos
    const diffTime = targetDate.getTime() - refDate.getTime();
    // Diferença em dias
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Quantas quinzenas (14 dias) se passaram?
    const fortnights = Math.floor(diffDays / 14);
    
    // Nova data de início
    const newStartDate = new Date(refDate);
    newStartDate.setDate(refDate.getDate() + (fortnights * 14));
    
    // Retorna YYYY-MM-DD
    return newStartDate.toISOString().split("T")[0];
}

export function getFortnightEnd(startDateStr: string): string {
    const start = new Date(startDateStr);
    const end = new Date(start);
    end.setDate(start.getDate() + 13);
    return end.toISOString().split("T")[0];
}
