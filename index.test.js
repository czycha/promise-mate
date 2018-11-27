const Mate = require('./')
const delay = require('delay')

const definitions = {
  random: () => Promise.resolve(Math.random()),
  delay: () => {
    var ms = Math.floor(Math.random() * 1000)
    return delay(ms, { value: ms })
  }
}

const eachPair = (arr, fn) => {
  for(let i = 0; i < arr.length; i++) {
    let a = arr[i]
    for(let j = i + 1; j < arr.length; j++) {
      let b = arr[j]
      fn(a, b)
    }
  }
}

const identity = (i) => i
const args = (...a) => a

test('shared requirements only computed once', async () => {
  const randoms = await Mate.all(definitions, [
    {
      requires: 'random',
      then: identity
    },
    {
      requires: ['random'],
      then: identity
    },
    {
      requires: ['random', 'random'],
      then: (int1, int2) => int2
    },
    {
      requires: ['random', 'delay'],
      then: identity
    },
    {
      requires: ['random', 'delay', 'random'],
      then: identity
    }
  ])
  expect(randoms[0]).toBeGreaterThanOrEqual(0)
  expect(randoms[0]).toBeLessThan(1)
  eachPair(randoms, (a, b) => { expect(a).toEqual(b) })

  const delays = await Mate.all(definitions, [
    {
      requires: 'delay',
      then: identity
    },
    {
      requires: ['delay'],
      then: identity
    },
    {
      requires: ['delay', 'delay'],
      then: (d1, d2) => d2
    },
    {
      requires: ['delay', 'random'],
      then: identity
    },
    {
      requires: ['delay', 'random', 'delay'],
      then: identity
    }
  ])
  expect(delays[0]).toBeGreaterThanOrEqual(0)
  expect(delays[0]).toBeLessThan(1000)
  eachPair(delays, (a, b) => { expect(a).toEqual(b) })
})

test('return requirement as-is when not in definitions', async () => {
  const results = await Mate.all(definitions, [
    {
      requires: ['i do not exist', 'random', {}],
      then: args
    },
    {
      requires: { 'a': 'a', 'b': 'b' },
      then: identity
    }
  ])

  expect(results[0][0]).toEqual('i do not exist')
  expect(results[0][1]).not.toEqual('random')
  expect(results[0][2]).toEqual({})

  expect(results[1]).toEqual({ 'a': 'a', 'b': 'b' })
})

test('return action.then when not a function', () => {
  expect(Mate.all(definitions, [
    {
      requires: 'delay',
      then: 'delayed'
    }
  ])).resolves.toEqual(['delayed'])
})