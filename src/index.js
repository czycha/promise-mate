import isEqual from 'fast-deep-equal'
import isPrimitive from 'just-is-primitive'

function pushIfAbsent(arr, val) {
  let indexOf = -1
  if (isPrimitive(val)) {
    indexOf = arr.indexOf(val)
  } else {
    for(var i = 0; i < arr.length; i++) {
      if (isEqual(arr[i], val)) {
        indexOf = i
        break
      }
    }
  }
  if (indexOf === -1) {
    arr.push(val)
  }
  return indexOf === -1 ? (arr.length - 1) : indexOf
}

export default class Mate {
  constructor (definitions = {}) {
    this.definitions = definitions
  }
  define (key, definition) {
    this.definitions[key] = definition
    return this
  }
  undefine (key) {
    delete this.definitions[key]
    return this
  }
  all (actions) {
    return Mate.all(this.definitions, actions)
  }
  static all (definitions, actions) {
    const requirements = []
    const map = []
    for (let action of actions) {
      actionMap = []
      if (!Array.isArray(action.requires)) {
        actionMap.push(pushIfAbsent(requirements, action.requires))
      } else {
        for (let req of action.requires) {
          actionMap.push(pushIfAbsent(requirements, req))
        }
      }
      map.push(actionMap)
    }

    const promises = []
    for (let req of requirements) {
      if ('string' === (typeof req) && definitions.hasOwnProperty(req)) {
        promises.push(definitions[req]())
      } else {
        promises.push(req)
      }
    }

    return (
      Promise
        .all(promises)
        .then((results) => {
          const ret = []
          for (let i = 0; i < actions.length; i++) {
            const action = actions[i]
            const reqIndexes = map[i]
            const args = []
            for (let req of reqIndexes) {
              args.push(results[req])
            }
            ret.push((typeof action.then) === 'function' ? action.then(...args) : action.then)
          }
          return ret
        })
    )
  }
}
