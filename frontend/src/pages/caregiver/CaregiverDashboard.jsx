const summaryCards = [
  {
    label: 'Total Elderly',
    value: '2',
    helper: 'Active monitoring',
    icon: 'groups',
    helperIcon: 'trending',
    iconColor: '#0058be',
    helperColor: '#006c49',
  },
  {
    label: 'Need Attention',
    value: '0',
    helper: 'All systems normal',
    icon: 'priority',
    helperIcon: 'check',
    iconColor: '#ba1a1a',
    helperColor: '#006c49',
  },
  {
    label: 'Medication Progress',
    value: '85',
    suffix: '%',
    icon: 'pill',
    iconColor: '#006c49',
    progress: 85,
    progressColor: '#006c49',
  },
  {
    label: 'Active Alerts',
    value: '0',
    helper: 'Last check 2m ago',
    icon: 'bell',
    helperIcon: 'clock',
    iconColor: '#727785',
    helperColor: '#424754',
  },
]

const elderlyProfiles = [
  {
    name: 'Robert Chen',
    age: '78 years',
    initials: 'RC',
    gradient: 'from-[#d8e2ff] via-[#fefcff] to-[#ffdcc6]',
    avatarTone: '#0058be',
    doses: '4 / 6 Taken',
    doseColor: '#0b1c30',
    progress: 66,
    progressColor: '#0058be',
    nextLabel: 'Next: 4:00 PM',
    nextIcon: 'clock',
    caregivers: ['AL', 'MJ', '+1'],
  },
  {
    name: 'Maria Garcia',
    age: '82 years',
    initials: 'MG',
    gradient: 'from-[#ffdcc6] via-[#ffffff] to-[#6ffbbe]',
    avatarTone: '#924700',
    doses: '5 / 5 Taken',
    doseColor: '#006c49',
    progress: 100,
    progressColor: '#006c49',
    nextLabel: 'Completed for today',
    nextIcon: 'done',
    caregivers: ['SC'],
  },
]

function Icon({ name, className = '', style }) {
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
  }

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

function SummaryCard({ card }) {
  return (
    <article className="rounded-xl border border-[#c2c6d6] bg-[#ffffff] p-6 shadow-[0_10px_28px_rgba(33,49,69,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.12)]">
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-xs font-bold tracking-[0.05em] text-[#424754] uppercase">
          {card.label}
        </span>
        <Icon name={card.icon} style={{ color: card.iconColor }} />
      </div>

      <div className="flex items-baseline gap-1">
        <p className="m-0 text-5xl leading-[56px] font-black tracking-tight text-[#0b1c30]">
          {card.value}
        </p>
        {card.suffix ? (
          <span className="text-xl font-bold text-[#424754]">{card.suffix}</span>
        ) : null}
      </div>

      {card.progress ? (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#d3e4fe]">
          <div
            className="h-full rounded-full"
            style={{ width: `${card.progress}%`, backgroundColor: card.progressColor }}
          />
        </div>
      ) : (
        <div
          className="mt-1 flex items-center gap-1 text-sm"
          style={{ color: card.helperColor }}
        >
          <Icon name={card.helperIcon} className="h-4 w-4" />
          <span>{card.helper}</span>
        </div>
      )}
    </article>
  )
}

function ProfileCard({ profile }) {
  return (
    <article className="flex min-h-[360px] flex-col rounded-xl border border-[#c2c6d6] bg-[#ffffff] p-6 shadow-[0_10px_28px_rgba(33,49,69,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.12)]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="rounded-full border-2 border-[#2170e4] p-0.5">
            <div
              className={`grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br ${profile.gradient} text-lg font-black`}
              style={{ color: profile.avatarTone }}
            >
              {profile.initials}
            </div>
          </div>
          <div className="min-w-0">
            <h4 className="m-0 truncate text-xl font-bold text-[#0b1c30]">{profile.name}</h4>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-sm text-[#424754]">{profile.age}</span>
              <span className="inline-flex items-center gap-1 rounded bg-[#6cf8bb]/30 px-1.5 py-0.5 text-[10px] font-black tracking-wider text-[#006c49] uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-[#006c49]" />
                Online
              </span>
            </div>
          </div>
        </div>

        <button
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#727785] transition hover:bg-[#eff4ff] hover:text-[#0058be]"
          type="button"
          aria-label={`More options for ${profile.name}`}
        >
          <Icon name="more" />
        </button>
      </div>

      <div className="flex flex-1 flex-col space-y-4">
        <div className="space-y-2 rounded-lg bg-[#eff4ff] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-[#424754]">Daily Doses</span>
            <span className="text-sm font-black" style={{ color: profile.doseColor }}>
              {profile.doses}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#d3e4fe]">
            <div
              className="h-full rounded-full"
              style={{ width: `${profile.progress}%`, backgroundColor: profile.progressColor }}
            />
          </div>
          <div
            className="flex items-center gap-1 text-xs"
            style={{ color: profile.nextIcon === 'done' ? '#006c49' : '#424754' }}
          >
            <Icon name={profile.nextIcon} className="h-3.5 w-3.5" />
            <span>{profile.nextLabel}</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#c2c6d6]/50 pt-4">
          <div>
            <span className="text-xs font-bold tracking-[0.05em] text-[#424754] uppercase">
              Alert Status
            </span>
            <span className="mt-1 flex items-center gap-1 text-sm font-black text-[#006c49]">
              <Icon name="check" className="h-4 w-4" />
              Normal
            </span>
          </div>

          <div className="flex -space-x-2">
            {profile.caregivers.map((caregiver) => (
              <div
                className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-[#e5eeff] text-[10px] font-black text-[#0058be]"
                key={caregiver}
              >
                {caregiver}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        className="mt-6 h-12 w-full rounded-lg border border-[#c2c6d6] text-base font-semibold text-[#424754] transition hover:bg-[#e5eeff] active:scale-[0.99]"
        type="button"
      >
        Open Dashboard
      </button>
    </article>
  )
}

function CaregiverDashboard() {
  return (
    <div className="flex min-h-svh flex-col bg-[#e5eeff] text-[#0b1c30]">
      <header className="sticky top-0 z-50 border-b border-[#c2c6d6] bg-[#f8f9ff]/85 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="m-0 text-3xl font-bold tracking-tight text-[#0058be]">CareConnect</h1>
            <p className="m-0 mt-1 text-sm text-[#424754]">
              Manage your elderly family members
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center lg:gap-6">
            <label className="flex h-11 items-center rounded-full bg-[#eff4ff] px-4 transition focus-within:ring-2 focus-within:ring-[#0058be]">
              <Icon name="search" className="mr-2 text-[#727785]" />
              <input
                className="w-full min-w-0 border-none bg-transparent text-sm text-[#0b1c30] outline-none placeholder:text-[#727785] md:w-56 lg:w-64"
                placeholder="Search profiles..."
                type="text"
              />
            </label>

            <div className="flex items-center gap-3">
              <button
                className="grid h-10 w-10 place-items-center rounded-full text-[#424754] transition hover:bg-[#e5eeff] hover:text-[#0058be]"
                type="button"
                aria-label="Help"
              >
                <Icon name="help" />
              </button>
              <button
                className="grid h-10 w-10 place-items-center rounded-full text-[#424754] transition hover:bg-[#e5eeff] hover:text-[#0058be]"
                type="button"
                aria-label="Settings"
              >
                <Icon name="settings" />
              </button>
              <button
                className="h-10 rounded-full bg-[#0058be] px-5 text-base font-semibold text-white transition hover:opacity-90 active:scale-95"
                type="button"
              >
                Add Elderly
              </button>
              <div className="grid h-10 w-10 place-items-center rounded-full border border-[#c2c6d6] bg-[#d3e4fe] text-xs font-black text-[#0058be]">
                NA
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] flex-1 space-y-10 px-4 py-10 sm:px-6">
        <section className="rounded-xl border border-[#adc6ff]/55 bg-[#dce9ff] px-6 py-5 shadow-[0_10px_28px_rgba(33,49,69,0.06)]">
          <p className="m-0 text-xs font-bold tracking-[0.05em] text-[#0058be] uppercase">
            Elderly Management
          </p>
          <h2 className="m-0 mt-2 text-3xl font-black tracking-tight text-[#0b1c30]">
            Family care overview
          </h2>
          <p className="m-0 mt-2 max-w-2xl text-sm text-[#424754]">
            Track medication progress, device status, and alerts for every monitored family member.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <SummaryCard card={card} key={card.label} />
          ))}
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="m-0 text-xl font-bold text-[#0b1c30]">Monitored Individuals</h2>
            <button
              className="inline-flex items-center gap-1 text-sm text-[#424754] transition hover:text-[#0058be]"
              type="button"
            >
              <Icon name="filter" className="h-4.5 w-4.5" />
              Filter
            </button>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            {elderlyProfiles.map((profile) => (
              <ProfileCard profile={profile} key={profile.name} />
            ))}

            <article className="group flex min-h-[360px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#adc6ff] bg-[#f8f9ff] p-6 text-center transition hover:-translate-y-0.5 hover:border-[#2170e4] hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.12)]">
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#dce9ff] text-[#0058be] transition group-hover:bg-[#2170e4] group-hover:text-white">
                <Icon name="plus" className="h-8 w-8" />
              </div>
              <h3 className="m-0 text-xl font-bold text-[#0b1c30]">Add Elderly</h3>
              <p className="mx-auto mt-1 mb-10 max-w-[220px] text-sm text-[#424754]">
                Connect a new elderly family member using a Pairing Code
              </p>
              <button
                className="mt-auto h-12 w-full rounded-lg bg-[#0058be] px-5 text-base font-semibold text-white transition hover:opacity-90 active:scale-95"
                type="button"
              >
                Connect Elderly
              </button>
            </article>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#c2c6d6] bg-[#f8f9ff] px-6 py-6 text-center text-sm text-[#424754]">
        &copy; 2024 CareConnect Healthcare Solutions. Built for reliable family monitoring.
      </footer>
    </div>
  )
}

export default CaregiverDashboard
