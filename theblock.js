import puppeteer from "puppeteer";
import {writeFileSync} from "fs";
import {parse} from 'json2csv';

const saveAsCSV = (csvData) => {
    const csv = parse(csvData)
    writeFileSync('result.csv', csv);
}

const getQuotes = async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C://chrome-win/chrome.exe',
        headless: false,
        defaultViewport: null,
    });

    // Open a new page
    const page = await browser.newPage();

    // await page.setDefaultNavigationTimeout(0)
    await page.goto("https://www.theblock.co/latest");

    await page.waitForTimeout(50000);
    
    let results = [];
    let data = [];
    let lastPageNumber = 10;

    for (let index = 0; index < lastPageNumber; index++) {
        await page.waitForTimeout(5000);
        results = results.concat(await extractedEvaluateCall(page));
        if (index !== lastPageNumber - 1) {
            await page.click('ul.b-pagination li.page-item button.page-link div.next');
            await page.waitForTimeout(5000);
        }
    }

    for (let i = 0; i < results.length; i++) {
        console.log(results[i].url);
        await page.goto(results[i].url);
        await page.waitForTimeout(5000);
        const article = await getArticles(page);

        const insertData = {
            title: results[i].title,
            date: results[i].date,
            articles: article.article,
            url: results[i].url
        }
        data.push(insertData)
    }

    // Close the browser
    await browser.close();

    saveAsCSV(data);
};

async function extractedEvaluateCall(page) {
    // Get page data
    const quotes = await page.evaluate(() => {
        const quoteList = document.querySelectorAll("div.collectionLatest article.articleCard");

        return Array.from(quoteList).map((quote) => {
            const url = quote.querySelector("div.cardContainer a").href;
            const title = quote.querySelector("div.contentContainer div.headline a h2 span").innerText;
            const date = quote.querySelector("div.contentContainer div.meta div.pubDate").innerText;

            return { url, title, date };
        });
    });

    return quotes;
}

async function getArticles(page) {
    await page.waitForSelector('article.articleBody')

    let article = '';

    try {
        article += await page.$eval("article.articleBody", el => el.innerText);
    } catch (e) {

    }

    return { article }
}

// Start the scraping
getQuotes();