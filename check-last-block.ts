import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const pageId = "061249f8-e9b2-4a21-8e94-5756868a0695";
    const page = await prisma.page.findUnique({ where: { id: pageId }, select: { blockJson: true } });
    if (!page) return console.log("Page not found");
    const blocks = page.blockJson as any[];
    console.log("Total blocks:", blocks.length);
    if (blocks.length > 0) {
        console.log("Last block:", JSON.stringify(blocks[blocks.length - 1], null, 2));
    }
}

main().finally(() => prisma.$disconnect());
