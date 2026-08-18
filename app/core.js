export const TRUMPS = [
  { value: 'spades', label: 'Spades', symbol: '♠', tone: 'black' },
  { value: 'hearts', label: 'Hearts', symbol: '♥', tone: 'red' },
  { value: 'diamonds', label: 'Diamonds', symbol: '♦', tone: 'red' },
  { value: 'clubs', label: 'Clubs', symbol: '♣', tone: 'black' },
  { value: 'none', label: 'No trump', symbol: '—', tone: 'none' },
]

export function standardRoundCount(playerCount) {
  if (playerCount < 3 || playerCount > 6) {
    throw new Error('Wizard requires 3 to 6 players.')
  }
  return Math.floor(60 / playerCount)
}

export function createGame(names, firstDealerIndex = 0) {
  const cleanNames = names.map((name) => name.trim())
  if (cleanNames.length < 3 || cleanNames.length > 6 || cleanNames.some((name) => !name)) {
    throw new Error('Enter names for 3 to 6 players.')
  }

  const players = cleanNames.map((name, index) => ({
    id: `player-${Date.now()}-${index}`,
    name,
  }))
  const totalRounds = standardRoundCount(players.length)
  const game = {
    id: `game-${Date.now()}`,
    createdAt: new Date().toISOString(),
    completedAt: null,
    players,
    firstDealerIndex,
    totalRounds,
    rounds: [],
  }
  game.rounds.push(createRound(game, 1))
  return game
}

export function createRound(game, number) {
  const dealerIndex = (game.firstDealerIndex + number - 1) % game.players.length
  const isFinalRound = number === game.totalRounds
  return {
    number,
    dealerIndex,
    trump: isFinalRound ? 'none' : null,
    phase: isFinalRound ? 'bidding' : 'trump',
    entries: game.players.map((player) => ({
      playerId: player.id,
      bid: null,
      tricksWon: null,
    })),
  }
}

export function biddingOrder(game, round) {
  return game.players.map((_, offset) => {
    const index = (round.dealerIndex + 1 + offset) % game.players.length
    return game.players[index]
  })
}

export function findEntry(round, playerId) {
  return round.entries.find((entry) => entry.playerId === playerId)
}

export function scoreEntry(entry) {
  if (entry.bid === null || entry.tricksWon === null) return null
  return entry.bid === entry.tricksWon
    ? 20 + 10 * entry.tricksWon
    : -10 * Math.abs(entry.bid - entry.tricksWon)
}

export function tricksStatus(round) {
  const entered = round.entries.filter((entry) => entry.tricksWon !== null).length
  const total = round.entries.reduce((sum, entry) => sum + (entry.tricksWon ?? 0), 0)
  return {
    entered,
    total,
    complete: total === round.number,
  }
}

export function fillUnenteredTricksWithZero(round) {
  for (const entry of round.entries) {
    if (entry.tricksWon === null) entry.tricksWon = 0
  }
}

export function roundPoints(round) {
  return Object.fromEntries(round.entries.map((entry) => [entry.playerId, scoreEntry(entry) ?? 0]))
}

export function cumulativePoints(game, throughRound = game.totalRounds) {
  const totals = Object.fromEntries(game.players.map((player) => [player.id, 0]))
  for (const round of game.rounds) {
    if (round.number > throughRound || round.phase !== 'complete') continue
    for (const entry of round.entries) {
      totals[entry.playerId] += scoreEntry(entry) ?? 0
    }
  }
  return totals
}

export function standings(game) {
  const totals = cumulativePoints(game)
  return game.players
    .map((player) => ({ ...player, score: totals[player.id] }))
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
}

export function scorecardRows(game) {
  return game.rounds
    .filter((round) => round.phase === 'complete')
    .map((round) => {
      const totals = cumulativePoints(game, round.number)
      return {
        roundNumber: round.number,
        players: game.players.map((player) => {
          const entry = findEntry(round, player.id)
          return {
            playerId: player.id,
            bid: entry.bid,
            tricksWon: entry.tricksWon,
            roundScore: scoreEntry(entry),
            totalScore: totals[player.id],
          }
        }),
      }
    })
}

export function currentRound(game) {
  return game.rounds[game.rounds.length - 1]
}

export function completeRound(game, round) {
  round.phase = 'complete'
  if (round.number === game.totalRounds) {
    game.completedAt = new Date().toISOString()
    return
  }
  game.rounds.push(createRound(game, round.number + 1))
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value))
}
