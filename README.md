# t2m-node

## TypeScript

```typescript
import { readFileSync } from 'fs';
import t2m from './t2m-node/';
let link = t2m(readFileSync('./my_torrent.torrent'), 'Torrent Name');

// link = magnet link
```

## JavaScript (Node.js)

```javascript
const { readFileSync } = require('fs');
const t2m = require('./t2m-node/');
let link = t2m(readFileSync('./my_torrent.torrent'), 'Torrent Name');

// link = magnet link
```

## JavaScript (Web)

```html
<head>
    <script src="https://zomoxyz.github.io/t2m.web.js"></script>
</head>
```

```javascript
addEventListener('load', () => {

    fetch('./my_torrent.torrent')
      .then(async response => {
        return await response.arrayBuffer();
      })
      .then(content => {
        return t2m(content, 'Torrent Name');
      })
      .then(link => {

        // link = magnet link

      })
      .catch((e) => {
        console.error(e);
      });
});
```
