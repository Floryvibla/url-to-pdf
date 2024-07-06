import { NextApiRequest } from "next";
import chromium from "@sparticuz/chromium-min";
import { NextRequest, NextResponse } from "next/server";
import {Browser} from "puppeteer";
import { Browser as CoreBrowser } from "puppeteer-core";

const isValidUrl = (text:string) => {
    const urlRegex = /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(\:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i;

    return urlRegex.test(text);
}

export async function GET(req: Request | NextRequest, res: NextResponse) {

    // get and valid URL
    const { searchParams } = new URL(req.url as string)
    const website_url = searchParams.get('url')
    if (!website_url) return NextResponse.json({ error: 'No URL provided' }, {status: 400})
    if (!isValidUrl(website_url)) return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    
    // const browser = await puppeteer.launch();
    let browser: Browser | CoreBrowser;

    if (process.env.NODE_ENV === 'production') {
        const puppeteer = await import("puppeteer-core");
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });
    }else {
        const puppeteer = await import("puppeteer");
        browser = await puppeteer.launch();
    }

    const page = await browser.newPage();
    
    // Open URL in current page
    await page.goto(website_url, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');

    const pdf = await page.pdf({
        path: 'symdev.pdf',
        margin: { top: '30px', right: '0px', bottom: '30px', left: '0px' },
        printBackground: true,
        format: 'A4',
        // footerTemplate: `
        //   <div style="font-size:10px; width:100%; text-align:center; padding-top:5px; border-top:1px solid #ddd;">
        //     <span class="pageNumber"></span> / <span class="totalPages"></span>
        //   </div>`,
        // displayHeaderFooter: true,
      });
    
      const headers = new Headers();
      headers.append("Content-Disposition", `attachment; filename="${'symdev.pdf'}"`);
      headers.append("Content-Type", "application/pdf");
    
    
      // Close the browser instance
      await browser.close();
    
    return new Response(pdf, { headers })
}