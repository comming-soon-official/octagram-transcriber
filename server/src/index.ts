import cors from 'cors' // Don't forget to install: npm install cors @types/cors
import dotenv from 'dotenv'
import express from 'express'

import { router as meetings } from './routes/meetings'
import { router as saveFootage } from './routes/save-footage'

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())

app.use(saveFootage)
app.use(meetings)
app.get('/', (req, res) => {
    res.send('This is me from TranscriberBackend')
})
// Start the server
const PORT = process.env.PORT || 5000
app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
)
