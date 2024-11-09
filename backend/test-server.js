console.log('Starting test...');

const express = require('express');
const app = express();

app.get('/', (req, res) => {
    console.log('Route accessed!');
    res.send('Hello World!');
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});