import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching recent pages...");
    const pages = await prisma.page.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: { id: true, title: true, blockJson: true, updatedAt: true }
    });

    for (const page of pages) {
        console.log(`Page: ${page.title} (${page.id}) - Updated: ${page.updatedAt}`);
        const blocks = page.blockJson as any[];
        console.log(`  Block count: ${blocks ? blocks.length : 0}`);
        if (blocks && blocks.length > 0) {
            const lastBlock = blocks[blocks.length - 1];
            console.log(`  Last block type: ${lastBlock.type}`);
            if (lastBlock.type === 'diagram') {
              console.log(`  Diagram props:`, JSON.stringify(lastBlock.props).slice(0, 100));
            }
        }
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
