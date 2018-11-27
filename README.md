# promise-mate

`Promise.all` fulfillment for many `Promises` to many callbacks to prevent duplicate calls when there are shared requirements.

## Use cases

Use promise-mate if you have multiple `Promises` to run synchronously that are required by multiple callbacks, some of which have overlapping requirements. This is particularly useful for modular callbacks that may not always be called as well as for resource fetching.

## Installation

```bash
npm i promise-mate
```

Or,

```bash
yarn add promise-mate
```

## Example

The below example fetches data to update the webpage.

```js
import Mate from 'promise-mate'

const runner = new Mate({
  users() {
    return fetch('/api/users').then(res => res.json()).then(json => json.users)
  },
  purchases() {
    return fetch('/api/purchases').then(res => res.json()).then(json => json.purchases)
  },
  products() {
    return fetch('/api/products').then(res => res.json()).then(json => json.products)
  },
  calendar() {  // Note: this Promise definition is not requested below so will not be run
    return fetch('/api/calendar').then(res => res.json()).then(json => json.calendar)
  }
});

runner
  .all([
    {
      requires: 'users',
      then(users) {
        // Update the user list!
      }
    },
    {
      requires: ['products', 'purchases'],
      then(products, purchases) {
        // Update product list to show if something's been bought
      }
    },
    {
      requires: [{ uuid: 1265723 }, 'users', 'products', 'purchases'],
      then(userData, users, products, purchases) {
        // Show user's latest purchases
      }
    }
  ])
  .then(() => { console.log('Page updated!') })
  .catch(() => { console.error('Error updating page') })
```

## API

### `Mate.all`

Run all actions.

```js
Mate.all(definitions, actions)
```

#### Arguments

- **`definitions`** - Key-indexed object with values that are functions that return Promises (or something else).
- **`actions`** - Array of objects defining requirements and callbacks.
  - **`actions[i].requires`** - Requirements to be passed as arguments to the callback. Can be a singular requirement or an array of requirements. Singular requirements cannot be an array. If a requirement is not a key in `definitions`, will resolve the requirement.
  - **`actions[i].then`** - Function to call when requirements resolve. Passes results as arguments in order of `actions[i].requires`.

#### Returns

- **`Promise<any[]>`** - An array of what each action's callback returns.

### `new Mate`

Create a `Mate` with stored definitions.

```js
var runner = new Mate(definitions)
```

#### Arguments

- **`definitions`** (optional) - Key-indexed object with values that are functions that return Promises (or something else).

### `Mate.prototype.define`

Store a Promise generating function.

```js
runner.define(key, definition)
```

#### Arguments

- **`key`** - Key for definition.
- **`definition`** - Function that returns a `Promise` (or something else since `Promise.all` will just resolve non-promises).

#### Returns

- The `Mate` instance.

### `Mate.prototype.undefine`

Delete a definition

```js
runner.undefine(key)
```

### Arguments

- **`key`** - Key for deletion.

### Returns

- The `Mate` instance.

### `Mate.prototype.all`

Run all actions.

```js
runner.all(actions)
```

#### Arguments

- **`actions`** - Array of objects defining requirements and callbacks.
  - **`actions[i].requires`** - Requirements to be passed as arguments to the callback. Can be a singular requirement or an array of requirements. Singular requirements cannot be an array. If a requirement is not a key in `definitions`, will resolve the requirement.
  - **`actions[i].then`** - Function to call when requirements resolve. Passes results as arguments in order of `actions[i].requires`.

#### Returns

- **`Promise<any[]>`** - An array of what each action's callback returns.
