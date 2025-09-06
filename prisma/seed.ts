import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash: hashedPassword,
      name: 'Test User',
      city: 'Jakarta',
      age: 25,
    },
  });

  console.log('✅ Created test user:', testUser.email);

  // Create sample chat
  const testChat = await prisma.chat.create({
    data: {
      userId: testUser.id,
      title: 'Travel Planning Chat',
      messages: {
        create: [
          {
            role: 'user',
            content: 'Hi! I want to plan a trip to Bali.',
          },
          {
            role: 'assistant',
            content: 'Hello! I\'d love to help you plan an amazing trip to Bali! 🌴 Can you tell me more about what you\'re looking for? How many days are you planning to stay, what\'s your budget, and what kind of experience are you hoping for?',
          },
        ],
      },
    },
  });

  console.log('✅ Created sample chat with ID:', testChat.id);

  // Create sample plan
  const samplePlan = await prisma.plan.create({
    data: {
      userId: testUser.id,
      days: 5,
      budget: 5000000,
      feeling: 'adventurous',
      originCity: 'Jakarta',
      optionsJson: [
        {
          id: 'opt_1',
          title: '5D4N Bali Adventure & Culture',
          summary: 'Perfect blend of adventure activities and cultural experiences across Ubud, Canggu, and Uluwatu.',
          estimatedCost: 4500000,
          highlights: [
            'White water rafting in Ubud',
            'Traditional cooking class',
            'Sunset at Tanah Lot',
            'Uluwatu cliff temple',
            'Beach surfing lessons',
            'Local warung dining'
          ],
          suitabilityScore: 0.92
        },
        {
          id: 'opt_2',
          title: '5D4N East Java Volcano Trek',
          summary: 'Epic volcano adventure featuring Mount Bromo sunrise and Ijen blue fire crater.',
          estimatedCost: 3800000,
          highlights: [
            'Mount Bromo sunrise',
            'Ijen blue fire crater',
            'Tumpak Sewu waterfall',
            'Local village homestay',
            'Traditional Javanese meals',
            'Photography spots'
          ],
          suitabilityScore: 0.89
        },
        {
          id: 'opt_3',
          title: '5D4N Yogyakarta Heritage',
          summary: 'Immerse in Javanese culture with temples, royal palaces, and traditional arts.',
          estimatedCost: 3200000,
          highlights: [
            'Borobudur sunrise tour',
            'Prambanan temple complex',
            'Sultan Palace (Kraton)',
            'Batik making workshop',
            'Gudeg food tour',
            'Malioboro street shopping'
          ],
          suitabilityScore: 0.85
        },
        {
          id: 'opt_4',
          title: '5D4N Lombok Island Escape',
          summary: 'Pristine beaches, snorkeling, and the majestic Mount Rinjani trek.',
          estimatedCost: 4200000,
          highlights: [
            'Gili Islands hopping',
            'Pink Beach exploration',
            'Mount Rinjani base trek',
            'Traditional Sasak village',
            'Snorkeling with turtles',
            'Beachfront accommodation'
          ],
          suitabilityScore: 0.88
        }
      ],
      status: 'suggested',
    },
  });

  console.log('✅ Created sample plan with ID:', samplePlan.id);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
