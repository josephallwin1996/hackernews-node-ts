import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(){
    const newLink = await prisma.link.create({
        data:{
            description: "Fullstack tutorial for graphQl",
            url: "www.howtographql.com"
        }
    })
    const allLinks  =  await prisma.link.findMany()
    console.log(allLinks);
}

main()
.finally(async () => {
    await prisma.$disconnect()
})