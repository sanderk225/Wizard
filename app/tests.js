import {
  biddingOrder,
  completeRound,
  createGame,
  createRound,
  cumulativePoints,
  fillUnenteredTricksWithZero,
  findEntry,
  scorecardRows,
  scoreEntry,
  standardRoundCount,
  tricksStatus,
} from './core.js'
import { RULE_SECTIONS } from './rules.js'

const results = []
function test(name, check) {
  try {
    check()
    results.push(`PASS  ${name}`)
  } catch (error) {
    results.push(`FAIL  ${name}\n      ${error.message}`)
  }
}
function equal(actual, expected) {
  if (actual !== expected) throw new Error(`Expected ${expected}, received ${actual}`)
}

const game = createGame(['Ada', 'Ben', 'Cy'], 1)

test('standard round counts', () => {
  equal(standardRoundCount(3), 20)
  equal(standardRoundCount(4), 15)
  equal(standardRoundCount(5), 12)
  equal(standardRoundCount(6), 10)
})

test('first bidder sits after dealer', () => {
  equal(game.rounds[0].dealerIndex, 1)
  equal(biddingOrder(game, game.rounds[0])[0].name, 'Cy')
})

test('dealer rotates clockwise', () => {
  equal(createRound(game, 2).dealerIndex, 2)
  equal(createRound(game, 3).dealerIndex, 0)
})

test('final round has no trump', () => {
  const finalRound = createRound(game, game.totalRounds)
  equal(finalRound.trump, 'none')
  equal(finalRound.phase, 'bidding')
})

test('Wizard scoring is calculated correctly', () => {
  equal(scoreEntry({ bid: 2, tricksWon: 2 }), 40)
  equal(scoreEntry({ bid: 3, tricksWon: 1 }), -20)
  equal(scoreEntry({ bid: 0, tricksWon: 0 }), 20)
})

test('zero is a completed trick entry, not unset', () => {
  const round = game.rounds[0]
  round.entries.forEach((entry) => { entry.bid = 0; entry.tricksWon = 0 })
  findEntry(round, game.players[0].id).tricksWon = 1
  const status = tricksStatus(round)
  equal(status.entered, 3)
  equal(status.total, 1)
  equal(status.complete, true)
})

test('untouched tricks become implicit zeros when total is reached', () => {
  const implicitRound = createRound(game, 2)
  implicitRound.entries.forEach((entry) => { entry.bid = 0 })
  implicitRound.entries[0].tricksWon = 2
  const status = tricksStatus(implicitRound)
  equal(status.entered, 1)
  equal(status.complete, true)
  fillUnenteredTricksWithZero(implicitRound)
  equal(implicitRound.entries[1].tricksWon, 0)
  equal(implicitRound.entries[2].tricksWon, 0)
})

test('completing a round updates cumulative scores', () => {
  const round = game.rounds[0]
  completeRound(game, round)
  equal(cumulativePoints(game, 1)[game.players[0].id], -10)
  equal(cumulativePoints(game, 1)[game.players[1].id], 20)
})

test('correcting saved source values recalculates totals', () => {
  const round = game.rounds[0]
  findEntry(round, game.players[0].id).bid = 1
  equal(cumulativePoints(game, 1)[game.players[0].id], 30)
})

test('scorecard includes all four metrics for each completed round', () => {
  const secondRound = game.rounds[1]
  secondRound.entries.forEach((entry) => { entry.bid = 0; entry.tricksWon = 0 })
  findEntry(secondRound, game.players[1].id).bid = 2
  findEntry(secondRound, game.players[1].id).tricksWon = 2
  completeRound(game, secondRound)
  const rows = scorecardRows(game)
  equal(rows.length, 2)
  equal(rows[0].players[0].bid, 1)
  equal(rows[0].players[0].tricksWon, 1)
  equal(rows[0].players[0].roundScore, 30)
  equal(rows[0].players[0].totalScore, 30)
  equal(rows[1].players[0].roundScore, 20)
  equal(rows[1].players[0].totalScore, 50)
})

test('rules reference includes rules and FAQ sections', () => {
  equal(RULE_SECTIONS.length, 15)
  equal(RULE_SECTIONS.some((section) => section.id === 'play'), true)
  equal(RULE_SECTIONS.some((section) => section.id === 'faq-correction'), true)
})

const failures = results.filter((result) => result.startsWith('FAIL')).length
document.querySelector('#results').textContent = `${results.join('\n')}\n\n${failures ? `${failures} failed` : 'All tests passed'}`
document.body.dataset.status = failures ? 'failed' : 'passed'
