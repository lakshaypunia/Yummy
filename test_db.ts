import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    const pages = await prisma.page.findMany({
        where: {
            geminiFileUri: { not: null }
        },
        select: {
            id: true,
            title: true,
            geminiFileUri: true,
            geminiCacheName: true
        }
    });
    console.log("Pages with RAG:", JSON.stringify(pages, null, 2));
}

run();
