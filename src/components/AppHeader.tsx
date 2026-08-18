interface AppHeaderProps {
  soundEnabled: boolean
  onSoundToggle: () => void
  onBack?: () => void
  title?: string
}

export function AppHeader({ soundEnabled, onSoundToggle, onBack, title }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="header-side">
        {onBack && <button type="button" className="icon-button" onClick={onBack} aria-label="Retour">‹</button>}
      </div>
      {title ? <p className="header-title">{title}</p> : <span />}
      <div className="header-side header-side-end">
        <button type="button" className="sound-button" onClick={onSoundToggle} aria-label={soundEnabled ? 'Désactiver les sons' : 'Activer les sons'} aria-pressed={soundEnabled}>
          <span aria-hidden="true">{soundEnabled ? '♪' : '♪̸'}</span>
          <span>{soundEnabled ? 'Son' : 'Muet'}</span>
        </button>
      </div>
    </header>
  )
}
