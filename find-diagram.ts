import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const pages = await prisma.page.findMany({ select: { id: true, title: true, blockJson: true } });
    let found = false;
    for (const page of pages) {
        const blocks = page.blockJson as any[];
        if (!blocks) continue;
        const diagrams = blocks.filter(b => b.type === 'diagram');
        if (diagrams.length > 0) {
            console.log(`Found ${diagrams.length} diagram(s) in Page: ${page.id} (${page.title})`);
            found = true;
        }
    }
    if (!found) console.log("NO DIAGRAMS FOUND IN ANY PAGE IN THE DATABASE.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
