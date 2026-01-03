import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create doctors
  const doctors = [
    {
      id: "dr-green",
      name: "John Green",
      image: "/assets/images/dr-green.png",
      specialty: "General Medicine",
    },
    {
      id: "dr-cameron",
      name: "Leila Cameron",
      image: "/assets/images/dr-cameron.png",
      specialty: "Cardiology",
    },
    {
      id: "dr-livingston",
      name: "David Livingston",
      image: "/assets/images/dr-livingston.png",
      specialty: "Neurology",
    },
    {
      id: "dr-peter",
      name: "Evan Peter",
      image: "/assets/images/dr-peter.png",
      specialty: "Pediatrics",
    },
    {
      id: "dr-powell",
      name: "Jane Powell",
      image: "/assets/images/dr-powell.png",
      specialty: "Dermatology",
    },
    {
      id: "dr-ramirez",
      name: "Alex Ramirez",
      image: "/assets/images/dr-remirez.png",
      specialty: "Orthopedics",
    },
    {
      id: "dr-lee",
      name: "Jasmine Lee",
      image: "/assets/images/dr-lee.png",
      specialty: "Psychiatry",
    },
    {
      id: "dr-cruz",
      name: "Alyana Cruz",
      image: "/assets/images/dr-cruz.png",
      specialty: "Ophthalmology",
    },
    {
      id: "dr-sharma",
      name: "Hardik Sharma",
      image: "/assets/images/dr-sharma.png",
      specialty: "ENT",
    },
  ];

  for (const doctor of doctors) {
    await prisma.doctor.upsert({
      where: { id: doctor.id },
      update: doctor,
      create: doctor,
    });
  }

  console.log(`✅ Created ${doctors.length} doctors`);

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

