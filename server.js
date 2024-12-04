import express from 'express';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';


const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static('public'));

app.post('/parse', async (req, res) => {
    try {
        const { link } = req.body;
        if (!link) {
            return res.status(400).json({ error: 'Link is required' });
        }

        const response = await fetch(link);
        const html = await response.text();

        const $ = cheerio.load(html);
        let text = '';
        const seenContent = new Set();
        const commonWords = new Set(['login', 'sign up', 'register', 'password', 'email', 'username', 'cookie', 'terms', 'privacy', 'policy', 'menu', 'search']);

        $('article, main, .content, .post, .entry').find('p, h1, h2, h3, h4, h5, h6').each((i, el) => {
            const content = $(el).text().trim().toLowerCase();
            
            if (content.length < 5 || commonWords.has(content)) {
                return;
            }

            const words = content.split(/\s+/);
            if (words.some(word => commonWords.has(word))) {
                return;
            }

            const normalized = content.replace(/[^\w\s]/g, '')
                                    .replace(/\s+/g, ' ')
                                    .trim();

            if (normalized && !seenContent.has(normalized)) {
                const similarExists = Array.from(seenContent).some(existing => {
                    return existing.includes(normalized) || normalized.includes(existing);
                });

                if (!similarExists) {
                    text += normalized + ' ';
                    seenContent.add(normalized);
                }
            }
        });

        text = text.trim();

        res.json({ 
            parsed_content: text
        });

    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to parse link',
            details: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Server link: http://localhost:${port}`);
});
