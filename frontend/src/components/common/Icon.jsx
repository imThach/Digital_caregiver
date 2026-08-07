const paths = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.7 2.7 0 0 1 5.2 1c0 2-2.7 2.2-2.7 4" />
      <path d="M12 17h.01" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.36a1.7 1.7 0 0 0-1 .2 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 3.64 15a1.7 1.7 0 0 0-.2-1A1.7 1.7 0 0 0 1.89 13H2a2 2 0 0 1 0-4h-.11a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 7 3.64a1.7 1.7 0 0 0 1-.2A1.7 1.7 0 0 0 9 1.89V2a2 2 0 0 1 4 0v-.11a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 20.36 7c.08.34.2.67.36 1A1.7 1.7 0 0 0 22.11 9H22a2 2 0 0 1 0 4h.11a1.7 1.7 0 0 0-1.55 1c-.17.32-.29.65-.36 1Z" />
    </>
  ),
  groups: (
    <>
      <path d="M16 20v-1.6c0-1.8-1.4-3.2-3.2-3.2H6.2A3.2 3.2 0 0 0 3 18.4V20" />
      <circle cx="9.5" cy="8" r="3.5" />
      <path d="M21 20v-1.5a3 3 0 0 0-2.3-2.9" />
      <path d="M16.8 4.3a3.5 3.5 0 0 1 0 6.8" />
    </>
  ),
  priority: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6" />
      <path d="M12 17h.01" />
    </>
  ),
  pill: (
    <>
      <path d="M10.5 20.5 3.5 13.5a4.2 4.2 0 0 1 6-6l7 7a4.2 4.2 0 0 1-6 6Z" />
      <path d="m8 12 4 4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
    </>
  ),
  trending: (
    <>
      <path d="m3 17 6-6 4 4 7-7" />
      <path d="M14 8h6v6" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  filter: (
    <>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </>
  ),
  more: (
    <>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </>
  ),
  done: (
    <>
      <path d="m4 12 4 4 8-8" />
      <path d="m13 16 2 2 5-5" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  'log-out': (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </>
  ),
}

export function Icon({ name, className = '', style }) {
  if (paths[name]) {
    return (
      <svg
        className={`h-5 w-5 fill-none stroke-current stroke-[2.2] ${className}`}
        viewBox="0 0 24 24"
        aria-hidden="true"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
      >
        {paths[name]}
      </svg>
    )
  }

  return (
    <span className={`material-symbols-outlined ${className}`} style={style}>
      {name}
    </span>
  )
}

export default Icon
