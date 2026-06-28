import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  try {
    await prisma.follow.deleteMany({});
    await prisma.like.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.user.deleteMany({});
  } catch (err) {
    console.log('Some tables may not exist yet, skipping delete phase.');
  }

  console.log('Seeding database with social media sample data...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const userA = await prisma.user.create({
    data: {
      email: 'user_a@example.com',
      username: 'user_a',
      name: 'Name_1',
      password: hashedPassword,
      bio: 'Hello, this is my bio. I am Name_1.',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=A',
    },
  });

  const userB = await prisma.user.create({
    data: {
      email: 'user_b@example.com',
      username: 'user_b',
      name: 'Name_2',
      password: hashedPassword,
      bio: 'Hello, this is my bio. I am Name_2.',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=B',
    },
  });

  const userC = await prisma.user.create({
    data: {
      email: 'user_c@example.com',
      username: 'user_c',
      name: 'Name_3',
      password: hashedPassword,
      bio: 'Hello, this is my bio. I am Name_3.',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=C',
    },
  });

  const post1 = await prisma.post.create({
    data: {
      userId: userA.id,
      content: 'This is a sample post from Name_1 (user_a) with an abstract vector image.',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    },
  });

  const post2 = await prisma.post.create({
    data: {
      userId: userB.id,
      content: 'This is a sample post from Name_2 (user_b) with a colorful graphic.',
      imageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800',
    },
  });

  const post3 = await prisma.post.create({
    data: {
      userId: userC.id,
      content: 'This is a sample post from Name_3 (user_c) with a minimalist abstract art.',
      imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800',
    },
  });

  await prisma.comment.createMany({
    data: [
      {
        postId: post1.id,
        userId: userB.id,
        content: 'This is a comment from Name_2 on Name_1\'s post.',
      },
      {
        postId: post1.id,
        userId: userC.id,
        content: 'This is a comment from Name_3 on Name_1\'s post.',
      },
      {
        postId: post2.id,
        userId: userC.id,
        content: 'This is a comment from Name_3 on Name_2\'s post.',
      },
      {
        postId: post3.id,
        userId: userA.id,
        content: 'This is a comment from Name_1 on Name_3\'s post.',
      },
    ],
  });

  await prisma.like.createMany({
    data: [
      { postId: post1.id, userId: userB.id },
      { postId: post1.id, userId: userC.id },
      { postId: post2.id, userId: userA.id },
      { postId: post2.id, userId: userC.id },
      { postId: post3.id, userId: userA.id },
    ],
  });

  await prisma.follow.createMany({
    data: [
      { followerId: userA.id, followingId: userB.id },
      { followerId: userA.id, followingId: userC.id },
      { followerId: userB.id, followingId: userA.id },
      { followerId: userC.id, followingId: userA.id },
      { followerId: userC.id, followingId: userB.id },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
