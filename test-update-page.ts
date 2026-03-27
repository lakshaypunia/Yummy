import { updatePage } from './lib/agent2/tools/update-page';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pages = await prisma.page.findMany({ select: { id: true }, take: 1 });
  if (pages.length === 0) return console.log("No pages to test on.");
  
  const pageId = pages[0].id;
  console.log("Testing updatePage on page ID:", pageId);

  try {
    const result = await updatePage(
      {
        pageId,
        blockType: "diagram",
        data: {
          elements: [{ type: "text", text: "TEST DIAGRAM" }],
          files: null
        }
      },
      { userId: "test_user_id" }
    );
    console.log("Result blocks length:", result.length);
    
    // Verify DB
    const updated = await prisma.page.findUnique({ where: { id: pageId }});
    const blocks = updated?.blockJson as any[];
    console.log("DB blocks length:", blocks?.length);
    console.log("Last block type:", blocks?.[blocks.length - 1]?.type);
  } catch (e) {
    console.error("updatePage failed:", e);
  }
}

main()
  .finally(() => prisma.$disconnect());
