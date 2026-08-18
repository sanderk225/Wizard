import {
  TRUMPS,
  biddingOrder,
  clone,
  completeRound,
  createGame,
  cumulativePoints,
  fillUnenteredTricksWithZero,
  currentRound,
  findEntry,
  roundPoints,
  scoreEntry,
  standings,
  standardRoundCount,
  tricksStatus,
} from './core.js'
import { clearStore, exportStore, loadStore, saveStore } from './storage.js'
import { RULE_SECTIONS } from './rules.js'

const root = document.querySelector('#app')
let store = loadStore()
let route = 'home'
let setupNames = ['', '', '']
let setupDealer = 0
let viewedRoundNumber = null
let correction = null
let notice = ''
let lastRenderKey = null
let rulesReturn = { route: 'home', viewedRoundNumber: null }

function activeGame() {
  return store.games.find((game) => game.id === store.activeGameId) ?? null
}

function persist() {
  saveStore(store)
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function playerName(game, playerId) {
  return game.players.find((player) => player.id === playerId)?.name ?? 'Unknown player'
}

function trumpInfo(value) {
  return TRUMPS.find((trump) => trump.value === value) ?? { label: 'Choose trump', symbol: '?' }
}

function formatScore(value) {
  return value > 0 ? `+${value}` : String(value)
}

function setNotice(message) {
  notice = message
  window.setTimeout(() => {
    if (notice === message) {
      notice = ''
      render()
    }
  }, 2600)
}

function appHeader(title, options = {}) {
  const { eyebrow = 'Wizard Scores', backAction = '', action = '' } = options
  return `
    <header class="topbar">
      ${backAction ? `<button class="icon-button" data-action="${backAction}" aria-label="Go back">←</button>` : '<img class="brand-mark" src="./icon-180.png" alt="" />'}
      <div class="topbar-title">
        <span>${escapeHtml(eyebrow)}</span>
        <strong>${escapeHtml(title)}</strong>
      </div>
      ${action || '<span class="topbar-spacer"></span>'}
    </header>
  `
}

function rulesButton() {
  return '<button class="icon-button rules-icon" data-action="open-rules" aria-label="Rules and FAQ" title="Rules & FAQ">?</button>'
}

function bottomAction(label, action, options = {}) {
  const { disabled = false, secondary = '', below = '' } = options
  return `
    <footer class="bottom-actions">
      <div class="bottom-action-row">
        ${secondary}
        <button class="primary-button" data-action="${action}" ${disabled ? 'disabled' : ''}>${escapeHtml(label)} <span aria-hidden="true">→</span></button>
      </div>
      ${below ? `<div class="below-action">${below}</div>` : ''}
    </footer>
  `
}

function render() {
  const game = activeGame()
  const round = game ? (viewedRoundNumber ? game.rounds.find((item) => item.number === viewedRoundNumber) : currentRound(game)) : null
  const renderKey = route === 'rules'
    ? 'rules'
    : correction
    ? `correction-${correction.roundNumber}-${correction.mode}`
    : route === 'round' && round
      ? `round-${round.number}-${round.phase}`
      : route
  const shouldAnimate = renderKey !== lastRenderKey
  lastRenderKey = renderKey
  let content
  if (route === 'rules') content = renderRules()
  else if (route === 'setup') content = renderSetup()
  else if (route === 'round' && game) content = renderRound(game)
  else if (route === 'standings' && game) content = renderStandings(game)
  else if (route === 'summary' && game) content = renderSummary(game)
  else content = renderHome()

  root.innerHTML = `
    <div class="app-frame ${shouldAnimate ? 'screen-entering' : ''}">
      ${content}
      ${notice ? `<div class="toast" role="status">${escapeHtml(notice)}</div>` : ''}
    </div>
  `
}

function renderHome() {
  const game = activeGame()
  const recentGames = store.games
    .filter((item) => item.id !== store.activeGameId)
    .slice()
    .reverse()
    .slice(0, 3)

  return `
    <main class="home-view">
      <section class="home-hero">
        <img src="./icon-512.png" class="hero-mark" alt="" />
        <p class="kicker">Pocket scorekeeper</p>
        <h1>Wizard</h1>
        <p class="hero-copy">Bids, tricks, and standings. One round at a time.</p>
      </section>

      <section class="home-actions" aria-label="Game actions">
        ${game ? renderResumeGame(game) : ''}
        <button class="primary-button large" data-action="new-game"><span aria-hidden="true">＋</span> New game</button>
        <button class="secondary-button rules-home-button" data-action="open-rules"><span aria-hidden="true">?</span> Rules & FAQ</button>
      </section>

      ${recentGames.length ? `
        <section class="history-section">
          <div class="section-heading"><p class="kicker">On this phone</p><h2>Recent games</h2></div>
          <div class="history-list">
            ${recentGames.map((item) => {
              const winner = standings(item)[0]
              return `<div class="history-row"><div><strong>${escapeHtml(winner?.name ?? 'Game')}</strong><span>${item.completedAt ? 'Completed' : `Round ${currentRound(item).number}`}</span></div><strong>${winner?.score ?? 0}</strong></div>`
            }).join('')}
          </div>
        </section>
      ` : ''}

      <section class="utility-actions">
        ${store.games.length ? '<button class="text-button" data-action="export-data">Export backup</button>' : ''}
        ${store.games.length ? '<button class="text-button danger" data-action="clear-data">Delete all local data</button>' : ''}
      </section>
    </main>
  `
}

function renderResumeGame(game) {
  if (game.completedAt) {
    const winner = standings(game)[0]
    return `
      <button class="resume-panel" data-action="resume-game">
        <span class="resume-label">Last game</span>
        <strong>${escapeHtml(winner.name)} won</strong>
        <span>${formatScore(winner.score)} points <b>View results →</b></span>
      </button>
    `
  }
  const round = currentRound(game)
  return `
    <button class="resume-panel" data-action="resume-game">
      <span class="resume-label">In progress</span>
      <strong>Round ${round.number} of ${game.totalRounds}</strong>
      <span>${game.players.length} players <b>Resume →</b></span>
    </button>
  `
}

function renderSetup() {
  const canAdd = setupNames.length < 6
  const canStart = setupNames.length >= 3 && setupNames.every((name) => name.trim())
  return `
    ${appHeader('New game', { backAction: 'home', action: rulesButton() })}
    <main class="screen-content setup-view">
      <div class="screen-intro">
        <p class="kicker">Clockwise seating</p>
        <h1>Who is playing?</h1>
        <p>Enter players in the order they sit around the table.</p>
      </div>

      <section class="player-setup" aria-label="Players">
        ${setupNames.map((name, index) => `
          <div class="setup-player-row">
            <span class="seat-number">${index + 1}</span>
            <label><span class="sr-only">Player ${index + 1} name</span><input data-player-index="${index}" value="${escapeHtml(name)}" placeholder="Player ${index + 1}" autocomplete="off" /></label>
            ${setupNames.length > 3 ? `<button class="icon-button quiet" data-action="remove-player" data-index="${index}" aria-label="Remove player ${index + 1}">×</button>` : ''}
          </div>
        `).join('')}
        ${canAdd ? '<button class="add-player-button" data-action="add-player"><span aria-hidden="true">＋</span> Add player</button>' : ''}
      </section>

      <section class="dealer-setup">
        <div class="section-heading"><p class="kicker">First round</p><h2>Choose the dealer</h2></div>
        <div class="choice-grid">
          ${setupNames.map((name, index) => `
            <button class="choice-chip ${setupDealer === index ? 'selected' : ''}" data-action="choose-dealer" data-index="${index}">${escapeHtml(name.trim() || `Player ${index + 1}`)}</button>
          `).join('')}
        </div>
        <p class="supporting-copy">With ${setupNames.length} players, the game has <strong>${standardRoundCount(setupNames.length)} rounds</strong>. The dealer rotates clockwise.</p>
      </section>
    </main>
    ${bottomAction('Start game', 'start-game', { disabled: !canStart })}
  `
}

function renderRound(game) {
  const round = viewedRoundNumber
    ? game.rounds.find((item) => item.number === viewedRoundNumber) ?? currentRound(game)
    : currentRound(game)

  if (correction && correction.roundNumber === round.number) return renderCorrection(game, round)

  const dealer = game.players[round.dealerIndex]
  const firstBidder = biddingOrder(game, round)[0]
  const trump = trumpInfo(round.trump)
  const phaseLabel = round.phase === 'trump' ? 'Choose trump' : round.phase === 'bidding' ? 'Bidding' : round.phase === 'tricks' ? 'Tricks won' : 'Round review'

  return `
    ${appHeader(`Round ${round.number} of ${game.totalRounds}`, {
      backAction: 'home',
      eyebrow: phaseLabel,
      action: `<div class="topbar-actions">${rulesButton()}<button class="icon-button" data-action="standings" aria-label="View standings" title="Standings">≡</button></div>`,
    })}
    <main class="screen-content round-view">
      <section class="round-context">
        <div><span>Dealer</span><strong>${escapeHtml(dealer.name)}</strong></div>
        <div><span>First bid</span><strong>${escapeHtml(firstBidder.name)}</strong></div>
        <div class="trump-readout ${trump.tone}"><span>Trump</span><div><strong class="trump-symbol">${trump.symbol}</strong><strong class="trump-label">${escapeHtml(trump.label)}</strong></div></div>
      </section>
      <div class="round-progress"><span class="progress-${Math.ceil((round.number / game.totalRounds) * 20)}"></span></div>
      ${round.phase === 'trump' ? renderTrumpPhase(round) : ''}
      ${round.phase === 'bidding' ? renderBiddingPhase(game, round) : ''}
      ${round.phase === 'tricks' ? renderTricksPhase(game, round) : ''}
      ${round.phase === 'review' ? renderReviewPhase(game, round) : ''}
      ${round.phase === 'complete' ? renderCompletedRound(game, round) : ''}
    </main>
  `
}

function trumpButtons(selected, action = 'set-trump') {
  return `<div class="trump-picker" role="group" aria-label="Trump suit">
    ${TRUMPS.map((trump) => `<button class="trump-button ${trump.tone} ${selected === trump.value ? 'selected' : ''}" data-action="${action}" data-trump="${trump.value}" aria-label="${trump.label}"><span>${trump.symbol}</span><small>${trump.value === 'none' ? 'None' : trump.label}</small></button>`).join('')}
  </div>`
}

function renderTrumpPhase(round) {
  return `
    <section class="phase-section">
      <div class="screen-intro compact"><p class="kicker">Before bidding</p><h1>What is trump?</h1><p>Choose None for a Jester or when every card has been dealt.</p></div>
      ${trumpButtons(round.trump)}
    </section>
  `
}

function numberControl(kind, entry, round, enabled, draft = false) {
  const value = kind === 'bid' ? entry.bid : entry.tricksWon
  const actionPrefix = draft ? 'draft-' : ''
  const action = kind === 'bid' ? `${actionPrefix}adjust-bid` : `${actionPrefix}adjust-tricks`
  const zeroAction = kind === 'bid' ? `${actionPrefix}zero-bid` : `${actionPrefix}zero-tricks`
  return `
    <div class="stepper ${enabled ? '' : 'disabled'}">
      <button data-action="${action}" data-player-id="${entry.playerId}" data-delta="-1" ${enabled ? '' : 'disabled'} aria-label="Decrease ${kind}">−</button>
      <button class="stepper-value" data-action="${zeroAction}" data-player-id="${entry.playerId}" ${enabled ? '' : 'disabled'} aria-label="${value === null ? `Set ${kind} to zero` : `${kind}: ${value}`}">${value === null ? '<small>Set</small> 0' : value}</button>
      <button data-action="${action}" data-player-id="${entry.playerId}" data-delta="1" ${enabled ? '' : 'disabled'} aria-label="Increase ${kind}">＋</button>
    </div>
  `
}

function renderBiddingPhase(game, round) {
  const order = biddingOrder(game, round)
  const bids = round.entries.filter((entry) => entry.bid !== null)
  const bidTotal = bids.reduce((sum, entry) => sum + entry.bid, 0)
  const allEntered = bids.length === game.players.length

  return `
    <section class="phase-section">
      <div class="phase-heading">
        <div><p class="kicker">Clockwise bidding</p><h1>Enter all bids</h1><p>Start at the top, then continue down the table.</p></div>
        <div class="round-count"><strong>${round.number}</strong><span>tricks</span></div>
      </div>
      <div class="entry-list">
        ${order.map((player, orderIndex) => {
          const entry = findEntry(round, player.id)
          return `<div class="entry-row">
            <div class="entry-person"><span>${orderIndex + 1}</span><div><strong>${escapeHtml(player.name)}</strong><small>${orderIndex === 0 ? 'Bids first' : `Bids ${orderIndex + 1}${orderIndex === 1 ? 'nd' : orderIndex === 2 ? 'rd' : 'th'}`}</small></div></div>
            ${numberControl('bid', entry, round, true)}
          </div>`
        }).join('')}
      </div>
      <div class="phase-summary ${allEntered && bidTotal === round.number ? 'warning' : ''}">
        <span>Total bids</span><strong>${bidTotal} of ${round.number}</strong>
        <p class="hook-message ${allEntered && bidTotal === round.number ? '' : 'hidden'}">The hook is in play: at least one player must miss.</p>
      </div>
    </section>
    ${bottomAction('Confirm all bids', 'proceed-tricks', { disabled: !allEntered })}
  `
}

function renderTricksPhase(game, round) {
  const status = tricksStatus(round)
  return `
    <section class="phase-section">
      <div class="phase-heading">
        <div><p class="kicker">Any order</p><h1>Tricks won</h1><p>Enter the winners. Untouched players count as zero.</p></div>
        <div class="round-count"><strong>${status.total}</strong><span>of ${round.number}</span></div>
      </div>
      <div class="entry-list">
        ${game.players.map((player) => {
          const entry = findEntry(round, player.id)
          const points = scoreEntry(entry)
          return `<div class="entry-row">
            <div class="entry-person"><div><strong>${escapeHtml(player.name)}</strong><small>Bid ${entry.bid}${points === null ? '' : ` · ${formatScore(points)} pts`}</small></div></div>
            ${numberControl('tricks', entry, round, true)}
          </div>`
        }).join('')}
      </div>
      <div class="phase-summary ${status.total > round.number ? 'error' : ''}">
        <span>Tricks assigned</span><strong>${status.total} of ${round.number}</strong>
        ${status.total > round.number ? '<p>Too many tricks assigned.</p>' : ''}
      </div>
    </section>
    ${bottomAction('Score round', 'review-round', {
      disabled: !status.complete,
      below: '<button class="footer-correction" data-action="edit-current-bids">Correct bids</button>',
    })}
  `
}

function renderReviewPhase(game, round) {
  const points = roundPoints(round)
  const priorTotals = cumulativePoints(game, round.number - 1)
  return `
    <section class="phase-section review-section">
      <div class="screen-intro compact"><p class="kicker">Check before saving</p><h1>Round ${round.number} review</h1><p>Correct bids or tricks now, or edit this round later from standings.</p></div>
      <div class="score-columns" aria-hidden="true"><span>Player</span><span>Round</span><span>Total</span></div>
      <div class="score-list">
        ${game.players.map((player) => {
          const entry = findEntry(round, player.id)
          const hit = entry.bid === entry.tricksWon
          return `<div class="score-row ${hit ? 'hit' : 'miss'}">
            <div class="score-player"><strong>${escapeHtml(player.name)}</strong><span>Bid ${entry.bid} · Won ${entry.tricksWon}</span></div>
            <strong class="round-score">${formatScore(points[player.id])}</strong>
            <strong class="total-score">${formatScore(priorTotals[player.id] + points[player.id])}</strong>
          </div>`
        }).join('')}
      </div>
    </section>
    ${bottomAction(round.number === game.totalRounds ? 'Finish game' : `Save & start round ${round.number + 1}`, 'confirm-round', {
      below: '<button class="footer-correction" data-action="edit-current-tricks">Correct tricks</button>',
    })}
  `
}

function renderCompletedRound(game, round) {
  const points = roundPoints(round)
  return `
    <section class="phase-section review-section">
      <div class="screen-intro compact"><p class="kicker">Saved round</p><h1>Round ${round.number}</h1><p>${trumpInfo(round.trump).label} · ${escapeHtml(game.players[round.dealerIndex].name)} dealt</p></div>
      <div class="score-list">
        ${game.players.map((player) => {
          const entry = findEntry(round, player.id)
          return `<div class="score-row"><div><strong>${escapeHtml(player.name)}</strong><span>Bid ${entry.bid} · Won ${entry.tricksWon}</span></div><strong>${formatScore(points[player.id])}</strong></div>`
        }).join('')}
      </div>
      <button class="secondary-button full" data-action="edit-completed-round" data-round="${round.number}">Edit round</button>
      <button class="text-button edit-link" data-action="standings">Back to standings</button>
    </section>
  `
}

function renderStandings(game) {
  const ranked = standings(game)
  const latest = currentRound(game)
  return `
    ${appHeader('Standings', { backAction: game.completedAt ? 'summary' : 'round', eyebrow: game.completedAt ? 'Final scores' : `After round ${game.rounds.filter((round) => round.phase === 'complete').length}`, action: rulesButton() })}
    <main class="screen-content standings-view">
      <section class="leaderboard">
        ${ranked.map((player, index) => `<div class="rank-row ${index === 0 ? 'leader' : ''}"><span class="rank">${index + 1}</span><strong>${escapeHtml(player.name)}</strong><span>${formatScore(player.score)}</span></div>`).join('')}
      </section>
      <section class="round-history">
        <div class="section-heading"><p class="kicker">Score history</p><h2>Rounds</h2></div>
        <div class="round-grid">
          ${game.rounds.filter((round) => round.phase === 'complete').map((round) => `<button data-action="view-round" data-round="${round.number}"><strong>${round.number}</strong><span>${trumpInfo(round.trump).symbol}</span></button>`).join('')}
          ${!game.completedAt ? `<button class="current" data-action="return-current"><strong>${latest.number}</strong><span>Now</span></button>` : ''}
        </div>
      </section>
    </main>
    ${!game.completedAt ? bottomAction('Continue game', 'return-current') : ''}
  `
}

function renderSummary(game) {
  const ranked = standings(game)
  const winner = ranked[0]
  return `
    ${appHeader('Game complete', { backAction: 'home', eyebrow: `${game.totalRounds} rounds played`, action: rulesButton() })}
    <main class="screen-content summary-view">
      <section class="winner-section">
        <div class="winner-burst" aria-hidden="true">★</div>
        <p class="kicker">Winner</p>
        <h1>${escapeHtml(winner.name)}</h1>
        <strong>${formatScore(winner.score)} points</strong>
      </section>
      <section class="final-ranking">
        ${ranked.map((player, index) => `<div class="rank-row"><span class="rank">${index + 1}</span><strong>${escapeHtml(player.name)}</strong><span>${formatScore(player.score)}</span></div>`).join('')}
      </section>
      <div class="summary-actions"><button class="secondary-button" data-action="standings">Round history</button><button class="primary-button" data-action="new-game">New game</button></div>
    </main>
  `
}

function renderCorrection(game, originalRound) {
  const draft = correction.draft
  const mode = correction.mode
  const status = tricksStatus(draft)
  const valid = draft.trump && draft.entries.every((entry) => entry.bid !== null && entry.tricksWon !== null) && status.complete
  return `
    ${appHeader(`Correct round ${draft.number}`, { backAction: 'cancel-correction', eyebrow: 'Unsaved changes', action: rulesButton() })}
    <main class="screen-content correction-view">
      <div class="correction-tabs" role="tablist">
        <button class="${mode === 'trump' ? 'selected' : ''}" data-action="correction-mode" data-mode="trump">Trump</button>
        <button class="${mode === 'bids' ? 'selected' : ''}" data-action="correction-mode" data-mode="bids">Bids</button>
        <button class="${mode === 'tricks' ? 'selected' : ''}" data-action="correction-mode" data-mode="tricks">Tricks</button>
      </div>
      ${mode === 'trump' ? `<section class="phase-section"><div class="screen-intro compact"><h1>Trump suit</h1></div>${trumpButtons(draft.trump, 'draft-set-trump')}</section>` : ''}
      ${mode === 'bids' ? `<section class="phase-section"><div class="screen-intro compact"><h1>Correct bids</h1><p>Original bidding order is preserved.</p></div><div class="entry-list">${biddingOrder(game, draft).map((player, index) => { const entry = findEntry(draft, player.id); return `<div class="entry-row"><div class="entry-person"><span>${index + 1}</span><strong>${escapeHtml(player.name)}</strong></div>${numberControl('bid', entry, draft, true, true)}</div>` }).join('')}</div></section>` : ''}
      ${mode === 'tricks' ? `<section class="phase-section"><div class="phase-heading"><div><h1>Correct tricks</h1><p>Enter in any order.</p></div><div class="round-count"><strong>${status.total}</strong><span>of ${draft.number}</span></div></div><div class="entry-list">${game.players.map((player) => { const entry = findEntry(draft, player.id); return `<div class="entry-row"><div class="entry-person"><strong>${escapeHtml(player.name)}</strong></div>${numberControl('tricks', entry, draft, true, true)}</div>` }).join('')}</div>${status.entered === game.players.length && !status.complete ? '<div class="phase-summary error"><p>Assigned tricks must equal the round number.</p></div>' : ''}</section>` : ''}
    </main>
    ${bottomAction('Save corrections', 'save-correction', { disabled: !valid, secondary: '<button class="secondary-button" data-action="cancel-correction">Cancel</button>' })}
  `
}

function renderRules() {
  const returnLabel = rulesReturn.route === 'home' ? 'Return home' : 'Return to game'
  return `
    ${appHeader('Rules & FAQ', { backAction: 'return-rules', eyebrow: 'Quick reference' })}
    <main class="screen-content rules-view">
      <div class="rules-sections">
        ${RULE_SECTIONS.map((section) => `
          <article class="rules-section ${section.type}">
            <p class="kicker">${escapeHtml(section.eyebrow)}</p>
            <h2>${escapeHtml(section.title)}</h2>
            ${(section.paragraphs ?? []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
            ${section.bullets ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>` : ''}
            ${section.examples ? `<div class="rule-examples">${section.examples.map((example) => `<p>${escapeHtml(example)}</p>`).join('')}</div>` : ''}
          </article>
        `).join('')}
      </div>
    </main>
    ${bottomAction(returnLabel, 'return-rules')}
  `
}

function clampRoundValue(value, round) {
  return Math.max(0, Math.min(round.number, value))
}

function adjustEntry(round, playerId, field, delta) {
  const entry = findEntry(round, playerId)
  if (!entry) return
  const current = entry[field]
  entry[field] = clampRoundValue(current === null ? (delta > 0 ? 1 : 0) : current + delta, round)
}

function zeroEntry(round, playerId, field) {
  const entry = findEntry(round, playerId)
  if (entry) entry[field] = 0
}

root.addEventListener('input', (event) => {
  const input = event.target.closest('[data-player-index]')
  if (!input) return
  setupNames[Number(input.dataset.playerIndex)] = input.value
})

root.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]')
  if (!button || button.disabled) return
  const action = button.dataset.action
  const game = activeGame()
  const round = game ? (viewedRoundNumber ? game.rounds.find((item) => item.number === viewedRoundNumber) : currentRound(game)) : null

  if (action === 'home') { route = 'home'; viewedRoundNumber = null; correction = null }
  if (action === 'open-rules') {
    rulesReturn = { route, viewedRoundNumber }
    route = 'rules'
  }
  if (action === 'return-rules') {
    route = rulesReturn.route
    viewedRoundNumber = rulesReturn.viewedRoundNumber
  }
  if (action === 'new-game') { setupNames = ['', '', '']; setupDealer = 0; route = 'setup' }
  if (action === 'resume-game' && game) { viewedRoundNumber = null; route = game.completedAt ? 'summary' : 'round' }
  if (action === 'add-player' && setupNames.length < 6) setupNames.push('')
  if (action === 'remove-player') { setupNames.splice(Number(button.dataset.index), 1); setupDealer = Math.min(setupDealer, setupNames.length - 1) }
  if (action === 'choose-dealer') setupDealer = Number(button.dataset.index)
  if (action === 'start-game') {
    try {
      const newGame = createGame(setupNames, setupDealer)
      store.games.push(newGame)
      store.activeGameId = newGame.id
      viewedRoundNumber = null
      route = 'round'
      persist()
    } catch (error) { setNotice(error.message) }
  }

  if (action === 'set-trump' && round && round.phase !== 'complete') { round.trump = button.dataset.trump; if (round.phase === 'trump') round.phase = 'bidding'; persist() }
  if (action === 'adjust-bid' && round) { adjustEntry(round, button.dataset.playerId, 'bid', Number(button.dataset.delta)); persist() }
  if (action === 'zero-bid' && round) { zeroEntry(round, button.dataset.playerId, 'bid'); persist() }
  if (action === 'proceed-tricks' && round) { round.phase = 'tricks'; persist() }
  if (action === 'adjust-tricks' && round) { adjustEntry(round, button.dataset.playerId, 'tricksWon', Number(button.dataset.delta)); persist() }
  if (action === 'zero-tricks' && round) { zeroEntry(round, button.dataset.playerId, 'tricksWon'); persist() }
  if (action === 'review-round' && round && tricksStatus(round).complete) { fillUnenteredTricksWithZero(round); round.phase = 'review'; persist() }
  if (action === 'edit-current-bids' && round) { round.phase = 'bidding'; persist() }
  if (action === 'edit-current-tricks' && round) { round.phase = 'tricks'; persist() }
  if (action === 'confirm-round' && round) {
    completeRound(game, round)
    viewedRoundNumber = null
    route = game.completedAt ? 'summary' : 'round'
    persist()
  }

  if (action === 'standings' && game) { viewedRoundNumber = null; route = 'standings' }
  if (action === 'round' && game) { viewedRoundNumber = null; route = 'round' }
  if (action === 'summary' && game) route = 'summary'
  if (action === 'return-current' && game) { viewedRoundNumber = null; route = 'round' }
  if (action === 'view-round' && game) { viewedRoundNumber = Number(button.dataset.round); route = 'round' }
  if (action === 'edit-completed-round' && round) correction = { roundNumber: round.number, mode: 'tricks', draft: clone(round) }
  if (action === 'cancel-correction') correction = null
  if (action === 'correction-mode' && correction) correction.mode = button.dataset.mode
  if (action === 'draft-set-trump' && correction) correction.draft.trump = button.dataset.trump
  if (action === 'draft-adjust-bid' && correction) adjustEntry(correction.draft, button.dataset.playerId, 'bid', Number(button.dataset.delta))
  if (action === 'draft-zero-bid' && correction) zeroEntry(correction.draft, button.dataset.playerId, 'bid')
  if (action === 'draft-adjust-tricks' && correction) adjustEntry(correction.draft, button.dataset.playerId, 'tricksWon', Number(button.dataset.delta))
  if (action === 'draft-zero-tricks' && correction) zeroEntry(correction.draft, button.dataset.playerId, 'tricksWon')
  if (action === 'save-correction' && correction && game) {
    correction.draft.phase = 'complete'
    game.rounds[correction.roundNumber - 1] = correction.draft
    correction = null
    persist()
    setNotice('Round corrected. Standings updated.')
  }

  if (action === 'export-data') exportStore(store)
  if (action === 'clear-data' && window.confirm('Delete every saved Wizard game from this phone?')) {
    clearStore()
    store = loadStore()
    route = 'home'
    viewedRoundNumber = null
  }

  render()
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch((error) => console.warn('Offline mode unavailable.', error)))
}

render()
