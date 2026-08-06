import React from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'

export function Card({ children, className = '' }) {
  return (
    <article className={`rounded-xl border border-[#c2c6d6] bg-[#ffffff] p-6 shadow-[0_10px_28px_rgba(33,49,69,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.12)] ${className}`}>
      {children}
    </article>
  )
}

export function SummaryCard({ card }) {
  return (
    <Card>
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
    </Card>
  )
}

export function ProfileCard({ profile }) {
  const navigate = useNavigate()

  return (
    <Card className="flex min-h-[360px] flex-col">
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
        onClick={() => navigate('/elderly-overview')}
      >
        View
      </button>
    </Card>
  )
}

export default Card
