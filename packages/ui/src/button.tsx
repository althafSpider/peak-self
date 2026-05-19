import * as React from "react"

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  appName?: string
}

export function Button({ appName: _appName, ...props }: ButtonProps) {
  return <button {...props} />
}

