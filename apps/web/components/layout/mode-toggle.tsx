"use client"
import React from 'react'
import { ThemeSwitcher } from '../kibo-ui/theme-switcher'
import { useTheme } from 'next-themes'

const ModeToggle = () => {
    const { setTheme,theme } = useTheme()
  return (
    <ThemeSwitcher defaultValue="system" onChange={setTheme} value={theme as "light" | "dark" | "system"} />
  )
}

export default ModeToggle
