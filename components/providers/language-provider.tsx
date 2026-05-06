"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { AppLanguage } from "@/lib/types"

interface LanguageContextType {
  lang: AppLanguage
  setLang: (l: AppLanguage) => void
  t: typeof translations["en"]
}

export const translations = {
  en: {
    dashboard: "Dashboard Overview",
    scheduler: "Smart Scheduler",
    emergencies: "Emergency Shifts & Swaps",
    taxi: "Transport Management",
    staff: "Staff Directory",
    shortage: "Staff Shortage Alerts",
    users: "User Management",
    settings: "System Settings",
    welcome: "Welcome",
    signOut: "Sign Out",
    reportSickLeave: "Report Sick Leave",
    suddenIllness: "Sudden Illness",
    otherReason: "Other Reason",
    highPriority: "HIGH PRIORITY",
    sendAlert: "Send High Priority Alert",
    submitLeave: "Submit Sick Leave",
    leaveType: "Leave Type",
    yourZone: "Your Zone",
    date: "Date",
    from: "From",
    to: "To",
    note: "Note (optional)",
    sickLeaveReported: "Sick leave reported.",
    highPriorityAlertSent: "🚨 High priority alert sent to all branches.",
    alertSentToManager: "Alert sent to your manager.",
    close: "Close",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    profileSaved: "Profile saved",
    fullName: "Full Name",
    email: "Email",
    phone: "Phone",
    position: "Position",
    branch: "Branch",
    skillsProficiency: "Skills & Proficiency",
    noneSet: "None set — edit to add skills",
    weeklySchedule: "Weekly Schedule",
    optimizeWithGroq: "Optimize with Groq",
    optimizing: "Optimizing…",
    addShift: "Add Shift",
    noShifts: "No shifts",
    add: "Add",
    staffMember: "Staff Member",
    zone: "Zone",
    start: "Start",
    end: "End",
    fillAllFields: "Fill in all fields.",
  },
  ru: {
    dashboard: "Обзор панели",
    scheduler: "Умный планировщик",
    emergencies: "Экстренные смены и замены",
    taxi: "Управление транспортом",
    staff: "Список сотрудников",
    shortage: "Оповещения о нехватке персонала",
    users: "Управление пользователями",
    settings: "Настройки системы",
    welcome: "Добро пожаловать",
    signOut: "Выйти",
    reportSickLeave: "Сообщить о больничном",
    suddenIllness: "Внезапная болезнь",
    otherReason: "Другая причина",
    highPriority: "ВЫСОКИЙ ПРИОРИТЕТ",
    sendAlert: "Отправить срочное уведомление",
    submitLeave: "Подать заявку на больничный",
    leaveType: "Тип отпуска",
    yourZone: "Ваша зона",
    date: "Дата",
    from: "С",
    to: "До",
    note: "Примечание (необязательно)",
    sickLeaveReported: "Больничный зарегистрирован.",
    highPriorityAlertSent: "🚨 Срочное уведомление отправлено во все филиалы.",
    alertSentToManager: "Уведомление отправлено менеджеру.",
    close: "Закрыть",
    edit: "Редактировать",
    save: "Сохранить",
    cancel: "Отмена",
    profileSaved: "Профиль сохранён",
    fullName: "Полное имя",
    email: "Электронная почта",
    phone: "Телефон",
    position: "Должность",
    branch: "Филиал",
    skillsProficiency: "Навыки и уровень",
    noneSet: "Не указано — нажмите редактировать",
    weeklySchedule: "Недельное расписание",
    optimizeWithGroq: "Оптимизировать с Groq",
    optimizing: "Оптимизация…",
    addShift: "Добавить смену",
    noShifts: "Нет смен",
    add: "Добавить",
    staffMember: "Сотрудник",
    zone: "Зона",
    start: "Начало",
    end: "Конец",
    fillAllFields: "Заполните все поля.",
  },
  lt: {
    dashboard: "Valdymo skydelis",
    scheduler: "Išmanus planuotojas",
    emergencies: "Skubios pamainos ir keitimai",
    taxi: "Transporto valdymas",
    staff: "Darbuotojų katalogas",
    shortage: "Personalo trūkumo įspėjimai",
    users: "Vartotojų valdymas",
    settings: "Sistemos nustatymai",
    welcome: "Sveiki",
    signOut: "Atsijungti",
    reportSickLeave: "Pranešti apie nedarbingumą",
    suddenIllness: "Staigi liga",
    otherReason: "Kita priežastis",
    highPriority: "AUKŠTAS PRIORITETAS",
    sendAlert: "Siųsti skubų įspėjimą",
    submitLeave: "Pateikti nedarbingumo prašymą",
    leaveType: "Atostogų tipas",
    yourZone: "Jūsų zona",
    date: "Data",
    from: "Nuo",
    to: "Iki",
    note: "Pastaba (neprivaloma)",
    sickLeaveReported: "Nedarbingumas užregistruotas.",
    highPriorityAlertSent: "🚨 Skubus įspėjimas išsiųstas į visus filialus.",
    alertSentToManager: "Įspėjimas išsiųstas vadybininkui.",
    close: "Uždaryti",
    edit: "Redaguoti",
    save: "Išsaugoti",
    cancel: "Atšaukti",
    profileSaved: "Profilis išsaugotas",
    fullName: "Vardas Pavardė",
    email: "El. paštas",
    phone: "Telefonas",
    position: "Pareigos",
    branch: "Filialas",
    skillsProficiency: "Įgūdžiai ir lygis",
    noneSet: "Nenustatyta — spustelėkite redaguoti",
    weeklySchedule: "Savaitės tvarkaraštis",
    optimizeWithGroq: "Optimizuoti su Groq",
    optimizing: "Optimizuojama…",
    addShift: "Pridėti pamainą",
    noShifts: "Nėra pamainų",
    add: "Pridėti",
    staffMember: "Darbuotojas",
    zone: "Zona",
    start: "Pradžia",
    end: "Pabaiga",
    fillAllFields: "Užpildykite visus laukus.",
  },
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>("en")

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("remo_lang") as AppLanguage | null
    if (saved && ["en", "ru", "lt"].includes(saved)) setLangState(saved)
  }, [])

  const setLang = (l: AppLanguage) => {
    setLangState(l)
    localStorage.setItem("remo_lang", l)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)
