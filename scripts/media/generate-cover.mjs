import { GoogleGenAI } from '@google/genai'
import { writeFileSync } from 'fs'

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDHZLaFSmiz_Ggp9Zht5NhAJ9JjlHcj0yw'
const prompt = process.argv[2]
const filename = process.argv[3] || 'cover.png'
const model = process.argv[4] || 'gemini-2.5-flash-image'

if (!prompt) {
  console.error('Usage: node scripts/generate-cover.mjs "<prompt>" [filename] [model]')
  process.exit(1)
}

const ai = new GoogleGenAI({ apiKey: API_KEY })

console.log(`Generating with model: ${model}...`)
console.log('Prompt:', prompt.slice(0, 80) + '...')

const response = await ai.models.generateContent({
  model,
  contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
  config: { responseModalities: ['IMAGE', 'TEXT'] }
})

for (const part of response.candidates[0].content.parts) {
  if (part.inlineData) {
    const outputPath = `references/${filename}`
    writeFileSync(outputPath, Buffer.from(part.inlineData.data, 'base64'))
    console.log(`Saved: ${outputPath}`)
    process.exit(0)
  }
}

console.log('No image in response.')
const textParts = response.candidates[0].content.parts.filter(p => p.text)
if (textParts.length) console.log('Text:', textParts.map(p => p.text).join('\n'))
